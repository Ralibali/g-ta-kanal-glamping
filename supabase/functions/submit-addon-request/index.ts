import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

interface Item { addon_id: string; quantity: number }

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
      from: Deno.env.get('ELKS46_FROM') || 'GoGlamping',
      to: toPhone, message: body,
    }),
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  let body: { public_token?: string; items?: Item[] } = {}
  try { body = await req.json() } catch {}
  const token = body.public_token
  const items = Array.isArray(body.items) ? body.items.filter(i => i.addon_id && i.quantity > 0) : []
  if (!token || items.length === 0) {
    return new Response(JSON.stringify({ error: 'public_token and items required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, guest_name, guest_first_name, tent_name, tent_id, checkin_date, email, phone, language, booking_number, public_token')
    .eq('public_token', token).maybeSingle()
  if (!booking) {
    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Cutoff: must be >= cutoff_days before check-in
  const { data: settings } = await supabase.from('app_settings').select('key,value').in('key', ['order_cutoff_days', 'owner_email', 'swish_number', 'swish_payee'])
  const sMap: Record<string, any> = {}
  for (const r of (settings ?? [])) sMap[r.key] = r.value
  const cutoffDays = Number(sMap['order_cutoff_days'] ?? 2)
  const ownerEmail = String(sMap['owner_email'] ?? 'info@auroramedia.se')
  const swishNumber = String(sMap['swish_number'] ?? '1230628289')
  const swishPayee = String(sMap['swish_payee'] ?? 'Aurora Media AB')

  const fmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' })
  const todayStr = fmt.format(new Date())
  const today = new Date(todayStr)
  const checkin = new Date(booking.checkin_date)
  const daysLeft = Math.floor((checkin.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  if (daysLeft < cutoffDays) {
    return new Response(JSON.stringify({ error: 'too_late', days_left: daysLeft }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Fetch addons
  const addonIds = items.map(i => i.addon_id)
  const { data: addons } = await supabase.from('addons').select('id, slug, name_sv, name_en, price_sek, unit, max_quantity, active').in('id', addonIds)
  const addonMap = new Map((addons ?? []).map(a => [a.id, a]))

  const lang: 'sv' | 'en' = (booking.language ?? 'en').toLowerCase().startsWith('sv') ? 'sv' : 'en'
  const orderRows: any[] = []
  const emailItems: { name: string; quantity: number; total: number }[] = []
  let total = 0
  let hasEarly = false
  for (const it of items) {
    const a = addonMap.get(it.addon_id)
    if (!a || !a.active) continue
    const qty = Math.min(Math.max(1, Math.floor(it.quantity)), a.max_quantity)
    const lineTotal = a.price_sek * qty
    total += lineTotal
    if (a.slug === 'early_checkin') hasEarly = true
    orderRows.push({
      booking_id: booking.id, addon_id: a.id, quantity: qty,
      unit_price_sek: a.price_sek, total_sek: lineTotal, status: 'requested',
    })
    emailItems.push({ name: lang === 'sv' ? a.name_sv : a.name_en, quantity: qty, total: lineTotal })
  }
  if (orderRows.length === 0) {
    return new Response(JSON.stringify({ error: 'no_valid_items' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { error: insertErr } = await supabase.from('addon_orders').insert(orderRows)
  if (insertErr) {
    return new Response(JSON.stringify({ error: insertErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const tentName = booking.tent_name || booking.tent_id
  const firstName = booking.guest_first_name || (booking.guest_name ? booking.guest_name.split(',')[0].split(' ').pop() : null)
  const swishRef = booking.booking_number || String(booking.public_token).slice(0, 8).toUpperCase()

  // Owner email
  try {
    await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateName: 'addon-request-owner',
        recipientEmail: ownerEmail,
        idempotencyKey: `addon-owner-${booking.id}-${Date.now()}`,
        templateData: {
          guestName: booking.guest_name, tentName,
          checkinDate: booking.checkin_date,
          items: emailItems, total, hasEarlyCheckin: hasEarly,
          adminUrl: 'https://goglampingsweden.se/admin/addon-orders',
        },
      }),
    })
  } catch (err) { console.error('owner email failed', err) }

  // Guest email
  if (booking.email) {
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: 'addon-request-guest',
          recipientEmail: booking.email,
          idempotencyKey: `addon-guest-${booking.id}-${Date.now()}`,
          templateData: {
            firstName, tentName, items: emailItems, total, lang,
            swishNumber, swishPayee, swishReference: swishRef,
          },
        }),
      })
    } catch (err) { console.error('guest email failed', err) }
  }

  // Guest SMS
  const phone = normalizePhone(booking.phone)
  if (phone) {
    const itemsStr = emailItems.map(i => `${i.quantity}× ${i.name}`).join(', ')
    const smsBody = lang === 'sv'
      ? `Tack ${firstName ?? ''}! Beställt: ${itemsStr}. Swisha ${total} kr till ${swishNumber} (${swishPayee}), meddelande: ${swishRef}. Vi ses!`
      : `Thank you ${firstName ?? ''}! Order: ${itemsStr}. Swish ${total} SEK to ${swishNumber} (${swishPayee}), message: ${swishRef}. See you!`
    try { await sendSms(phone, smsBody) } catch (err) { console.error('sms failed', err) }
  }

  return new Response(JSON.stringify({
    success: true, total, count: orderRows.length,
    swish: { number: swishNumber, payee: swishPayee, reference: swishRef, amount: total },
  }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
