import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import Stripe from 'https://esm.sh/stripe@18.5.0'

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const t = raw.replace(/[\s\-()]/g, '')
  if (!t) return null
  if (t.startsWith('+')) return t
  if (t.startsWith('00')) return '+' + t.slice(2)
  if (t.startsWith('0')) return '+46' + t.slice(1)
  return '+' + t
}

async function sendSms(toPhone: string, body: string) {
  const user = Deno.env.get('ELKS46_USERNAME')
  const pass = Deno.env.get('ELKS46_PASSWORD')
  if (!user || !pass) return
  const auth = btoa(`${user}:${pass}`)
  await fetch('https://api.46elks.com/a1/sms', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      from: ((Deno.env.get('ELKS46_FROM') || 'GoGlamping').replace(/[^A-Za-z0-9]/g, '').slice(0, 11)) || 'GoGlamping',
      to: toPhone, message: body,
    }),
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  let body: { session_id?: string } = {}
  try { body = await req.json() } catch {}
  const sessionId = body.session_id
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'session_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: 'stripe_not_configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' })

  let session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch (err: any) {
    console.error('stripe retrieve failed', err)
    return new Response(JSON.stringify({ error: 'stripe_error', details: err?.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const paid = session.payment_status === 'paid'
  if (!paid) {
    return new Response(JSON.stringify({ paid: false, status: session.payment_status }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Fetch pending orders for this session
  const { data: orders } = await supabase.from('addon_orders')
    .select('id, booking_id, addon_id, quantity, total_sek, status')
    .eq('stripe_session_id', sessionId)
  if (!orders || orders.length === 0) {
    return new Response(JSON.stringify({ paid: true, note: 'no orders found for session' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const alreadyPaid = orders.every(o => o.status === 'paid')
  if (alreadyPaid) {
    return new Response(JSON.stringify({ paid: true, already: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const orderIds = orders.map(o => o.id)
  const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
  await supabase.from('addon_orders').update({
    status: 'paid',
    paid_at: new Date().toISOString(),
    stripe_payment_intent: paymentIntent ?? null,
  }).in('id', orderIds)

  const bookingId = orders[0].booking_id
  if (!bookingId) {
    return new Response(JSON.stringify({ paid: true, warn: 'no booking_id' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { data: booking } = await supabase.from('bookings')
    .select('id, guest_name, guest_first_name, tent_name, tent_id, checkin_date, checkout_date, email, phone, language, booking_number')
    .eq('id', bookingId).maybeSingle()
  if (!booking) {
    return new Response(JSON.stringify({ paid: true, warn: 'booking missing' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const rawLang = (booking.language ?? 'sv').toLowerCase().slice(0, 2)
  const supportedLangs = ['sv', 'en', 'de', 'da', 'no', 'nl', 'fr']
  const lang: string = supportedLangs.includes(rawLang) ? rawLang : (rawLang === 'nb' || rawLang === 'nn' ? 'no' : 'en')
  const isSv = lang === 'sv'

  const { data: addons } = await supabase.from('addons')
    .select('id, slug, name_sv, name_en')
    .in('id', orders.map(o => o.addon_id))
  const addonMap = new Map((addons ?? []).map(a => [a.id, a]))

  const emailItems = orders.map(o => {
    const a = addonMap.get(o.addon_id)
    return { name: a ? (isSv ? a.name_sv : a.name_en) : 'Tillval', quantity: o.quantity, total: o.total_sek }
  })
  const total = orders.reduce((s, o) => s + o.total_sek, 0)
  const hasBreakfastOrder = orders.some(o => addonMap.get(o.addon_id)?.slug === 'breakfast')
  const hasFikaOrder = orders.some(o => addonMap.get(o.addon_id)?.slug === 'fika_bag')
  const hasEarly = orders.some(o => addonMap.get(o.addon_id)?.slug === 'early_checkin')

  const { data: settings } = await supabase.from('app_settings').select('key,value').in('key', ['owner_email'])
  const sMap: Record<string, any> = {}
  for (const r of (settings ?? [])) sMap[r.key] = r.value
  const ownerEmail = String(sMap['owner_email'] ?? 'info@auroramedia.se')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const tentName = booking.tent_name || booking.tent_id
  const firstName = booking.guest_first_name || (booking.guest_name ? booking.guest_name.split(',')[0].split(' ').pop() : null)
  const ref = booking.booking_number || bookingId.slice(0, 8).toUpperCase()

  // Owner email
  try {
    await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateName: 'addon-request-owner',
        recipientEmail: ownerEmail,
        idempotencyKey: `addon-owner-paid-${sessionId}`,
        templateData: {
          guestName: booking.guest_name,
          guestEmail: booking.email ?? null,
          guestLang: lang,
          tentName,
          checkinDate: booking.checkin_date,
          items: emailItems, total, hasEarlyCheckin: hasEarly,
          reference: ref,
          adminUrl: 'https://goglampingsweden.se/admin/addon-orders',
        },
      }),
    })
  } catch (err) { console.error('owner email failed', err) }

  // Karin (breakfast) notice
  if (hasBreakfastOrder || hasFikaOrder) {
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: 'breakfast-new-order',
          recipientEmail: 'Info@bostallets.se',
          idempotencyKey: `breakfast-new-paid-${sessionId}`,
          templateData: {
            guestName: booking.guest_name,
            tentName, bookingNumber: booking.booking_number,
            hasBreakfast: hasBreakfastOrder, hasFika: hasFikaOrder,
            breakfastDate: booking.checkout_date ?? null,
            fikaDate: booking.checkin_date,
            items: emailItems,
          },
        }),
      })
    } catch (err) { console.error('breakfast notice failed', err) }
  }

  // Guest email (paid confirmation)
  if (booking.email) {
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: 'addon-request-guest',
          recipientEmail: booking.email,
          idempotencyKey: `addon-guest-paid-${sessionId}`,
          templateData: {
            firstName, tentName, items: emailItems, total, lang,
            paid: true, reference: ref, swishReference: ref,
          },
        }),
      })
    } catch (err) { console.error('guest email failed', err) }
  }

  // Guest SMS
  const phone = normalizePhone(booking.phone)
  if (phone) {
    const itemsStr = emailItems.map(i => `${i.quantity}× ${i.name}`).join(', ')
    const smsBody = isSv
      ? `Tack ${firstName ?? ''}! Betalning mottagen: ${itemsStr}. Vi ses!`
      : `Thank you ${firstName ?? ''}! Payment received: ${itemsStr}. See you soon!`
    try { await sendSms(phone, smsBody) } catch (err) { console.error('sms failed', err) }
  }

  return new Response(JSON.stringify({ paid: true, count: orderIds.length, total }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
