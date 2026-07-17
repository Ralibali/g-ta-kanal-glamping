import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@18.5.0'

// Tar emot Stripe-webhooks så att betalningar bekräftas även om gästen
// stänger fliken innan den skickas tillbaka till /stay efter köpet.
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

  try {
    if (event.type === 'checkout.session.completed') {
      // Återanvänd hela bekräftelseflödet (markerar paid + skickar mail/SMS, idempotent)
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
      // Gästen betalade aldrig — släpp tillvalen så de kan beställas igen.
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
