// Records a Swish-paid purchase (late_checkout or sup_rental) and notifies the owner.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

type Kind = 'late_checkout' | 'sup_rental'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let body: { kind?: Kind; quantity?: number; public_token?: string } = {}
  try { body = await req.json() } catch {}

  const kind = body.kind
  if (kind !== 'late_checkout' && kind !== 'sup_rental') {
    return new Response(JSON.stringify({ error: 'invalid_kind' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const quantity = Math.max(1, Math.min(2, Math.floor(body.quantity ?? 1)))

  // Look up addon
  const { data: addon } = await supabase
    .from('addons').select('id, slug, name_sv, price_sek, max_quantity')
    .eq('slug', kind).maybeSingle()
  if (!addon) {
    return new Response(JSON.stringify({ error: 'addon_missing' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const qty = Math.min(quantity, addon.max_quantity ?? 1)
  const total = addon.price_sek * qty

  // Optional booking lookup
  let booking: any = null
  if (body.public_token) {
    const { data } = await supabase
      .from('bookings')
      .select('id, booking_number, guest_name, tent_name, tent_id, checkin_date, checkout_date, email, phone')
      .eq('public_token', body.public_token).maybeSingle()
    booking = data
  }

  // Insert order
  const { data: order, error: insertErr } = await supabase.from('addon_orders').insert({
    booking_id: booking?.id ?? null,
    addon_id: addon.id,
    quantity: qty,
    unit_price_sek: addon.price_sek,
    total_sek: total,
    status: 'paid',
    paid_at: new Date().toISOString(),
  }).select('id').single()
  if (insertErr) {
    return new Response(JSON.stringify({ error: insertErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Owner notification
  const { data: settings } = await supabase.from('app_settings').select('key,value').in('key', ['owner_email'])
  const ownerEmail = String((settings ?? []).find(s => s.key === 'owner_email')?.value ?? 'info@auroramedia.se')

  const subject = kind === 'late_checkout'
    ? `Sen utcheckning bokad – ${booking?.guest_name ?? 'okänd gäst'}`
    : `SUP-uthyrning (${qty} st) bokad${booking?.guest_name ? ` – ${booking.guest_name}` : ''}`

  const lines = [
    kind === 'late_checkout' ? 'En gäst har just bokat sen utcheckning till kl 12:00 (400 kr).' : `En gäst har just hyrt ${qty} SUP (${total} kr) i 24 timmar.`,
    '',
    `Belopp: ${total} kr (Swish till 1230628289)`,
    booking ? `Gäst: ${booking.guest_name ?? '—'}` : 'Gäst: SUP-walk-in (ingen bokning kopplad)',
    booking ? `Bokningsnummer: ${booking.booking_number}` : '',
    booking ? `Tält: ${booking.tent_name ?? booking.tent_id}` : '',
    booking ? `In/ut: ${booking.checkin_date} → ${booking.checkout_date}` : '',
    booking?.email ? `E-post: ${booking.email}` : '',
    booking?.phone ? `Telefon: ${booking.phone}` : '',
    '',
    'Syns nu under Tillvalsbeställningar i admin.',
  ].filter(Boolean).join('\n')

  try {
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateName: 'simple-owner-notice',
        recipientEmail: ownerEmail,
        idempotencyKey: `purchase-${order.id}`,
        templateData: { subject, body: lines },
      }),
    })
  } catch (err) { console.error('owner email failed', err) }

  return new Response(JSON.stringify({ ok: true, order_id: order.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
