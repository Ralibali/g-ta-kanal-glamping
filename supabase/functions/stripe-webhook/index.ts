import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@18.5.0'

// Tar emot Stripe-webhooks så att betalningar bekräftas även om gästen
// stänger fliken innan den skickas tillbaka till /stay eller /boka-direkt.
//
// Hanterar:
//   - Tillvalsbeställningar  (metadata.order_id / addon_orders.stripe_session_id)
//   - Direktbokningar        (metadata.be_booking_id / be_bookings.stripe_session_id)
//
// Konfiguration (engångssteg i Stripe Dashboard):
//   1. Developers → Webhooks → Add endpoint:
//      https://<projekt>.supabase.co/functions/v1/stripe-webhook
//   2. Välj event: checkout.session.completed, checkout.session.expired
//   3. Lägg endpointens "Signing secret" som secret STRIPE_WEBHOOK_SECRET.

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!stripeKey || !webhookSecret) return json({ error: 'webhook_not_configured' }, 500)

  const signature = req.headers.get('stripe-signature')
  if (!signature) return json({ error: 'missing_signature' }, 400)

  const rawBody = await req.text()
  const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('webhook signature verification failed', err)
    return json({ error: 'invalid_signature' }, 400)
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const session = event.data.object as Stripe.Checkout.Session
  const sessionId = session.id
  const beBookingId = session.metadata?.be_booking_id ?? null

  try {
    if (event.type === 'checkout.session.completed') {
      // 1) Direktbokning (be_bookings) — markera paid + confirmed
      if (beBookingId) {
        const amount = typeof session.amount_total === 'number' ? session.amount_total / 100 : null
        const { error } = await supabase
          .from('be_bookings')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            stripe_session_id: sessionId,
            payment_amount: amount ?? undefined,
          })
          .eq('id', beBookingId)
        if (error) console.error('be_bookings update failed', error)
        console.log('be_booking paid via webhook', beBookingId, sessionId, amount)
        return json({ received: true, be_booking: !error })
      }

      // 2) Tillvalsbeställning — återanvänd verify-flödet (mail/SMS, idempotent)
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const res = await fetch(`${supabaseUrl}/functions/v1/verify-addon-payment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      const payload = await res.json().catch(() => ({}))
      console.log('verify via webhook', sessionId, res.status, payload)
      return json({ received: true, verified: res.ok })
    }

    if (event.type === 'checkout.session.expired') {
      if (beBookingId) {
        const { error } = await supabase
          .from('be_bookings')
          .update({ payment_status: 'cancelled', status: 'cancelled' })
          .eq('id', beBookingId)
          .eq('payment_status', 'pending')
        if (error) console.error('cancel expired be_booking failed', error)
        return json({ received: true, be_cancelled: !error })
      }
      const { error } = await supabase
        .from('addon_orders')
        .update({ status: 'cancelled' })
        .eq('stripe_session_id', sessionId)
        .eq('status', 'pending')
      if (error) console.error('cancel expired orders failed', error)
      return json({ received: true, cancelled: !error })
    }

    return json({ received: true, ignored: event.type })
  } catch (err) {
    console.error('webhook handler failed', err)
    return json({ error: 'handler_failed' }, 500)
  }
})
