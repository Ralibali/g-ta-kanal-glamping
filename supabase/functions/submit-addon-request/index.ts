import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import Stripe from 'https://esm.sh/stripe@18.5.0'

interface Item { addon_id: string; quantity: number }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  let body: { public_token?: string; items?: Item[]; dietary?: string[]; dietary_note?: string } = {}
  try { body = await req.json() } catch {}
  const token = body.public_token
  const items = Array.isArray(body.items) ? body.items.filter(i => i.addon_id && i.quantity > 0) : []
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

  const rawLang = (booking.language ?? 'sv').toLowerCase().slice(0, 2)
  const supportedLangs = ['sv', 'en', 'de', 'da', 'no', 'nl', 'fr']
  const lang: string = supportedLangs.includes(rawLang) ? rawLang : (rawLang === 'nb' || rawLang === 'nn' ? 'no' : 'en')
  const isSv = lang === 'sv'

  const orderRows: any[] = []
  const lineItems: any[] = []
  let total = 0
  for (const it of items) {
    const a = addonMap.get(it.addon_id)
    if (!a || !a.active) continue
    const qty = Math.min(Math.max(1, Math.floor(it.quantity)), a.max_quantity)
    const lineTotal = a.price_sek * qty
    total += lineTotal
    orderRows.push({
      booking_id: booking.id, addon_id: a.id, quantity: qty,
      unit_price_sek: a.price_sek, total_sek: lineTotal, status: 'pending',
    })
    lineItems.push({
      price_data: {
        currency: 'sek',
        product_data: { name: isSv ? a.name_sv : a.name_en },
        unit_amount: a.price_sek * 100,
      },
      quantity: qty,
    })
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

  // Create Stripe Checkout session
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: 'stripe_not_configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' })

  const origin = req.headers.get('origin') || 'https://goglampingsweden.se'
  const ref = booking.booking_number || String(booking.public_token).slice(0, 8).toUpperCase()

  const localeMap: Record<string, string> = { sv: 'sv', en: 'en', de: 'de', da: 'da', no: 'nb', nl: 'nl', fr: 'fr' }
  const stripeLocale = localeMap[lang] || 'auto'

  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: booking.email || undefined,
      client_reference_id: booking.id,
      locale: stripeLocale as any,
      metadata: {
        booking_id: booking.id,
        public_token: String(booking.public_token),
        order_ids: orderIds.join(','),
        reference: ref,
      },
      payment_intent_data: {
        description: isSv ? `Tillval Go Glamping · ${ref}` : `Extras Go Glamping · ${ref}`,
        metadata: { booking_id: booking.id, reference: ref },
        receipt_email: booking.email || undefined,
      },
      success_url: `${origin}/stay/${token}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/stay/${token}?payment=cancelled`,
    })
  } catch (err: any) {
    console.error('stripe session failed', err)
    // Roll back the pending orders so they don't hang
    await supabase.from('addon_orders').delete().in('id', orderIds)
    return new Response(JSON.stringify({ error: err?.message || 'stripe_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  await supabase.from('addon_orders').update({ stripe_session_id: session.id }).in('id', orderIds)

  return new Response(JSON.stringify({
    success: true,
    url: session.url,
    session_id: session.id,
    total,
    count: orderIds.length,
  }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
