import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import Stripe from 'https://esm.sh/stripe@18.5.0'

interface Item { addon_id: string; quantity: number }

const STRIPE_PRICE_BY_SLUG: Record<string, string> = {
  breakfast: 'price_1TsUkLHzffTezY82PWYrzYcm',
  fika_bag: 'price_1TsqjQHzffTezY8212PMh3lv',
  early_checkin: 'price_1Tsqg8HzffTezY82GWJwqyzq',
  late_checkout: 'price_1Tsqg8HzffTezY82qAlTyuxQ',
  pet: 'price_1Tsqg9HzffTezY821RBaczlc',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  let body: { public_token?: string; items?: Item[]; dietary?: string[]; dietary_note?: string; payment_method?: 'stripe' | 'swish' } = {}
  try { body = await req.json() } catch {}
  const token = body.public_token
  const items = Array.isArray(body.items) ? body.items.filter(i => i.addon_id && i.quantity > 0) : []
  const paymentMethod: 'stripe' | 'swish' = body.payment_method === 'swish' ? 'swish' : 'stripe'
  const ALLOWED_DIETS = new Set(['gluten_free', 'vegan', 'vegetarian', 'lactose_free', 'nut_allergy'])
  const dietary = Array.isArray(body.dietary)
    ? Array.from(new Set(body.dietary.filter((d): d is string => typeof d === 'string' && ALLOWED_DIETS.has(d))))
    : []
  const dietaryNote = typeof body.dietary_note === 'string' ? body.dietary_note.trim().slice(0, 500) : ''
  if (!token || items.length === 0) {
    return new Response(JSON.stringify({ error: 'public_token and items required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, guest_name, guest_first_name, tent_name, tent_id, checkin_date, checkout_date, email, phone, language, booking_number, public_token')
    .eq('public_token', token).maybeSingle()
  if (!booking) {
    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { data: settings } = await supabase.from('app_settings').select('key,value').in('key', ['order_cutoff_days'])
  const sMap: Record<string, any> = {}
  for (const r of (settings ?? [])) sMap[r.key] = r.value
  const cutoffDays = Number(sMap['order_cutoff_days'] ?? 2)

  const fmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' })
  const todayStr = fmt.format(new Date())
  const today = new Date(todayStr)
  const checkin = new Date(booking.checkin_date)
  const daysLeft = Math.floor((checkin.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  if (daysLeft < cutoffDays) {
    return new Response(JSON.stringify({ error: 'too_late', days_left: daysLeft }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const addonIds = items.map(i => i.addon_id)
  const { data: addons } = await supabase.from('addons').select('id, slug, name_sv, name_en, price_sek, unit, max_quantity, active').in('id', addonIds)
  const addonMap = new Map((addons ?? []).map(a => [a.id, a]))

  const stayHasMondayMorning = (() => {
    const start = new Date(`${booking.checkin_date}T12:00:00Z`).getTime()
    const end = new Date(`${booking.checkout_date}T12:00:00Z`).getTime()
    for (let t = start + 86400000; t <= end; t += 86400000) {
      if (new Date(t).getUTCDay() === 1) return true
    }
    return false
  })()
  if (stayHasMondayMorning && items.some(it => addonMap.get(it.addon_id)?.slug === 'breakfast')) {
    return new Response(JSON.stringify({ error: 'breakfast_unavailable_monday' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const orderRows: any[] = []
  const lineItems: any[] = []
  const emailItemNames: { name: string; quantity: number; total: number; slug: string }[] = []
  let total = 0
  for (const it of items) {
    const a = addonMap.get(it.addon_id)
    if (!a || !a.active) continue
    const qty = Math.min(Math.max(1, Math.floor(it.quantity)), a.max_quantity)
    const lineTotal = a.price_sek * qty
    total += lineTotal
    orderRows.push({
      booking_id: booking.id, addon_id: a.id, quantity: qty,
      unit_price_sek: a.price_sek, total_sek: lineTotal,
      status: paymentMethod === 'swish' ? 'requested' : 'pending',
    })
    emailItemNames.push({ name: a.name_sv, quantity: qty, total: lineTotal, slug: a.slug })
    if (paymentMethod === 'stripe') {
      const price = STRIPE_PRICE_BY_SLUG[a.slug]
      if (!price) {
        return new Response(JSON.stringify({ error: `missing_stripe_price_for_${a.slug}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      lineItems.push({ price, quantity: qty })
    }
  }
  if (orderRows.length === 0) {
    return new Response(JSON.stringify({ error: 'no_valid_items' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Persist dietary preferences immediately (they matter even if payment is abandoned)
  if (dietary.length > 0 || dietaryNote) {
    try {
      const { data: existing } = await supabase.from('tent_stays')
        .select('dietary, dietary_note')
        .eq('booking_number', booking.booking_number)
        .eq('tent_id', booking.tent_id)
        .maybeSingle()
      const merged = Array.from(new Set([...(existing?.dietary ?? []), ...dietary]))
      const patch: Record<string, any> = {}
      if (merged.length > 0) patch.dietary = merged
      if (dietaryNote) {
        const prev = (existing?.dietary_note ?? '').trim()
        patch.dietary_note = prev && !prev.includes(dietaryNote) ? `${prev}\n${dietaryNote}` : (prev || dietaryNote)
      }
      if (Object.keys(patch).length > 0) {
        await supabase.from('tent_stays').update(patch).eq('booking_number', booking.booking_number)
      }
    } catch (err) { console.error('dietary sync failed', err) }
  }

  const { data: insertedOrders, error: insertErr } = await supabase
    .from('addon_orders').insert(orderRows).select('id')
  if (insertErr || !insertedOrders) {
    return new Response(JSON.stringify({ error: insertErr?.message || 'insert_failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const orderIds = insertedOrders.map(o => o.id)
  const ref = booking.booking_number || booking.id.slice(0, 8).toUpperCase()

  if (paymentMethod === 'swish') {
    // Notify owner immediately so they can watch Swish and confirm in admin
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const { data: ownerSetting } = await supabase.from('app_settings').select('value').eq('key', 'owner_email').maybeSingle()
      const ownerEmail = String((ownerSetting as any)?.value ?? 'info@auroramedia.se')
      await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: 'addon-request-owner',
          recipientEmail: ownerEmail,
          idempotencyKey: `addon-owner-swish-${orderIds.join('-')}`,
          templateData: {
            guestName: booking.guest_name,
            guestEmail: booking.email ?? null,
            guestLang: booking.language ?? 'sv',
            tentName: booking.tent_name || booking.tent_id,
            checkinDate: booking.checkin_date,
            items: emailItemNames.map(i => ({ name: i.name, quantity: i.quantity, total: i.total })),
            total,
            hasEarlyCheckin: emailItemNames.some(i => i.slug === 'early_checkin'),
            reference: ref,
            paymentMethod: 'swish',
            adminUrl: 'https://goglampingsweden.se/admin/addon-orders',
          },
        }),
      })
    } catch (err) { console.error('swish owner email failed', err) }

    return new Response(JSON.stringify({
      success: true, method: 'swish', total, count: orderIds.length, reference: ref,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: 'stripe_not_configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' })
  const origin = req.headers.get('origin') || 'https://goglampingsweden.se'
  const session = await stripe.checkout.sessions.create({
    customer_email: booking.email ?? undefined,
    line_items: lineItems,
    mode: 'payment',
    success_url: `${origin}/stay/${booking.public_token}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/stay/${booking.public_token}`,
    metadata: {
      booking_id: booking.id,
      booking_number: booking.booking_number ?? '',
      order_ids: orderIds.join(','),
    },
  })

  await supabase.from('addon_orders').update({ stripe_session_id: session.id }).in('id', orderIds)

  return new Response(JSON.stringify({
    success: true, method: 'stripe', url: session.url, session_id: session.id, total, count: orderIds.length,
  }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
