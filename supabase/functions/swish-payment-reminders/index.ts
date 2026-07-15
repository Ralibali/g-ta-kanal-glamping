import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Runs on cron every ~10 min. Sends admin email reminders for Swish addon orders
// that are still `requested` (unpaid) after 30 min and again after 2 hours.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const now = Date.now()
  const cutoff30m = new Date(now - 30 * 60 * 1000).toISOString()
  const cutoff2h = new Date(now - 120 * 60 * 1000).toISOString()
  // Ignore very old orders (>7 days) — they were likely abandoned
  const floor = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: orders, error } = await supabase
    .from('addon_orders')
    .select('id, booking_id, quantity, total_sek, created_at, swish_reminder_30m_at, swish_reminder_2h_at, addons:addon_id(slug, name_sv), bookings:booking_id(booking_number, guest_name, tent_name, tent_id, checkin_date, email, phone)')
    .eq('status', 'requested')
    .is('paid_at', null)
    .is('stripe_session_id', null)  // only Swish (Stripe orders have session_id)
    .gte('created_at', floor)
    .lte('created_at', cutoff30m)

  if (error) {
    console.error('query failed', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { data: ownerSetting } = await supabase.from('app_settings').select('value').eq('key', 'owner_email').maybeSingle()
  const ownerEmail = String((ownerSetting as any)?.value ?? 'info@auroramedia.se')

  // Group by booking so multiple items in the same order = one email
  const byBooking = new Map<string, any[]>()
  for (const o of (orders ?? [])) {
    if (!o.booking_id) continue
    if (!byBooking.has(o.booking_id)) byBooking.set(o.booking_id, [])
    byBooking.get(o.booking_id)!.push(o)
  }

  const results: any[] = []

  for (const [bookingId, group] of byBooking) {
    const oldest = group.reduce((a, b) => new Date(a.created_at) < new Date(b.created_at) ? a : b)
    const ageMs = now - new Date(oldest.created_at).getTime()
    const minutesAgo = Math.floor(ageMs / 60000)
    const b = oldest.bookings
    if (!b) continue

    const is2h = new Date(oldest.created_at).toISOString() <= cutoff2h
    const stage: '30m' | '2h' = is2h ? '2h' : '30m'

    // Skip if already sent for this stage
    const alreadySent = group.every((o) =>
      stage === '2h' ? o.swish_reminder_2h_at : o.swish_reminder_30m_at
    )
    if (alreadySent) continue

    const total = group.reduce((s, o) => s + Number(o.total_sek || 0), 0)
    const items = group.map((o) => ({
      name: o.addons?.name_sv ?? 'Tillval',
      quantity: o.quantity,
      total: Number(o.total_sek || 0),
    }))
    const ref = b.booking_number || bookingId.slice(0, 8).toUpperCase()

    try {
      const res = await fetch(`${Deno.env.get('SUPABASE_URL')!}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateName: 'swish-payment-reminder',
          recipientEmail: ownerEmail,
          idempotencyKey: `swish-reminder-${stage}-${bookingId}`,
          templateData: {
            guestName: b.guest_name,
            guestEmail: b.email,
            guestPhone: b.phone,
            tentName: b.tent_name || b.tent_id,
            checkinDate: b.checkin_date,
            items, total, reference: ref, minutesAgo, stage,
            adminUrl: 'https://goglampingsweden.se/admin/addon-orders',
          },
        }),
      })
      if (!res.ok) {
        console.error('reminder send failed', await res.text())
        continue
      }
    } catch (e) {
      console.error('reminder fetch failed', e)
      continue
    }

    const patch = stage === '2h'
      ? { swish_reminder_2h_at: new Date().toISOString() }
      : { swish_reminder_30m_at: new Date().toISOString() }
    await supabase.from('addon_orders').update(patch).in('id', group.map((o) => o.id))

    results.push({ bookingId, stage, minutesAgo, count: group.length })
  }

  return new Response(JSON.stringify({ success: true, reminders_sent: results.length, results }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
