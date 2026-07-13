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
  const ref = booking.booking_number || String(booking.public_token).slice(0, 8).toUpperCase()
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // === Swedish guests: keep the old Swish + SMS flow (no Stripe) ===
  if (isSv) {
    await supabase.from('addon_orders').update({ status: 'requested' }).in('id', orderIds)

    const { data: addonRows } = await supabase.from('addons')
      .select('id, slug, name_sv, name_en')
      .in('id', orderRows.map(r => r.addon_id))
    const aMap = new Map((addonRows ?? []).map((a: any) => [a.id, a]))
    const emailItems = orderRows.map(r => ({
      name: (aMap.get(r.addon_id) as any)?.name_sv ?? 'Tillval',
      quantity: r.quantity,
      total: r.total_sek,
    }))
    const hasBreakfast = orderRows.some(r => (aMap.get(r.addon_id) as any)?.slug === 'breakfast')
    const hasFika = orderRows.some(r => (aMap.get(r.addon_id) as any)?.slug === 'fika_bag')
    const hasEarly = orderRows.some(r => (aMap.get(r.addon_id) as any)?.slug === 'early_checkin')

    const { data: settings2 } = await supabase.from('app_settings').select('key,value').in('key', ['owner_email', 'swish_number'])
    const sMap2: Record<string, any> = {}
    for (const r of (settings2 ?? [])) sMap2[r.key] = r.value
    const ownerEmail = String(sMap2['owner_email'] ?? 'info@auroramedia.se')
    const swishNumber = String(sMap2['swish_number'] ?? '1230628289')

    const tentName = booking.tent_name || booking.tent_id
    const firstName = booking.guest_first_name || (booking.guest_name ? booking.guest_name.split(',')[0].split(' ').pop() : null)

    try {
      await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: 'addon-request-owner',
          recipientEmail: ownerEmail,
          idempotencyKey: `addon-owner-req-${orderIds.join('-')}`,
          templateData: {
            guestName: booking.guest_name,
            guestEmail: booking.email ?? null,
            guestLang: 'sv',
            tentName,
            checkinDate: booking.checkin_date,
            items: emailItems, total, hasEarlyCheckin: hasEarly,
            reference: ref,
            adminUrl: 'https://goglampingsweden.se/admin/addon-orders',
          },
        }),
      })
    } catch (err) { console.error('owner email failed', err) }

    if (hasBreakfast || hasFika) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateName: 'breakfast-new-order',
            recipientEmail: 'Info@bostallets.se',
            idempotencyKey: `breakfast-new-req-${orderIds.join('-')}`,
            templateData: {
              guestName: booking.guest_name,
              tentName, bookingNumber: booking.booking_number,
              hasBreakfast, hasFika,
              breakfastDate: booking.checkout_date ?? null,
              fikaDate: booking.checkin_date,
              items: emailItems,
            },
          }),
        })
      } catch (err) { console.error('breakfast notice failed', err) }
    }

    if (booking.email) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateName: 'addon-request-guest',
            recipientEmail: booking.email,
            idempotencyKey: `addon-guest-req-${orderIds.join('-')}`,
            templateData: {
              firstName, tentName, items: emailItems, total, lang: 'sv',
              paid: false, reference: ref, swishNumber,
            },
          }),
        })
      } catch (err) { console.error('guest email failed', err) }
    }

    const phoneRaw = (booking.phone ?? '').replace(/[\s\-()]/g, '')
    let phone: string | null = null
    if (phoneRaw) {
      if (phoneRaw.startsWith('+')) phone = phoneRaw
      else if (phoneRaw.startsWith('00')) phone = '+' + phoneRaw.slice(2)
      else if (phoneRaw.startsWith('0')) phone = '+46' + phoneRaw.slice(1)
      else phone = '+' + phoneRaw
    }
    if (phone) {
      const itemsStr = emailItems.map(i => `${i.quantity}× ${i.name}`).join(', ')
      const smsBody = `Tack ${firstName ?? ''}! Vi har tagit emot din beställning: ${itemsStr}. Swisha ${total} kr till ${swishNumber} med meddelande ${ref}. Vi bekräftar när betalningen kommit in.`
      try {
        const user = Deno.env.get('ELKS46_USERNAME')
        const pass = Deno.env.get('ELKS46_PASSWORD')
        if (user && pass) {
          const auth = btoa(`${user}:${pass}`)
          await fetch('https://api.46elks.com/a1/sms', {
            method: 'POST',
            headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              from: ((Deno.env.get('ELKS46_FROM') || 'GoGlamping').replace(/[^A-Za-z0-9]/g, '').slice(0, 11)) || 'GoGlamping',
              to: phone, message: smsBody,
            }),
          })
        }
      } catch (err) { console.error('sms failed', err) }
    }

    return new Response(JSON.stringify({
      success: true, swish: true, total, reference: ref, count: orderIds.length,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }



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
