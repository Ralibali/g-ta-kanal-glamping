import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@18.5.0'

// One signed Stripe endpoint handles both existing add-on payments and the
// native accommodation booking engine. The session metadata decides which
// idempotent confirmation path to run.

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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)
  const session = event.data.object as Stripe.Checkout.Session
  const sessionId = session.id
  const kind = session.metadata?.kind
  const nativeBookingId = session.metadata?.booking_id

  try {
    if (kind === 'native_booking' && nativeBookingId) {
      if (event.type === 'checkout.session.completed') {
        // Avoid confirming asynchronous payment methods before Stripe says paid.
        if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
          return json({ received: true, pending: true })
        }

        const paidSek = typeof session.amount_total === 'number'
          ? Math.round(session.amount_total / 100)
          : null

        const { data: booking, error } = await supabase
          .from('be_bookings')
          .update({
            payment_status: 'paid',
            payment_amount: paidSek,
            payment_expires_at: null,
            stripe_session_id: sessionId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', nativeBookingId)
          .eq('status', 'confirmed')
          .select('id,guest_name,guest_email,guest_phone,language,checkin_date,checkout_date,total_amount,payment_ref,guest_token,unit:be_units(name,legacy_tent_id)')
          .maybeSingle()

        if (error) {
          console.error('native booking confirmation failed', error)
          return json({ error: 'native_booking_confirmation_failed' }, 500)
        }

        if (booking?.guest_email) {
          // Transactional confirmation is best-effort. Payment confirmation must
          // never be rolled back because the mail provider is temporarily down.
          fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              templateName: 'native-booking-confirmation',
              recipientEmail: booking.guest_email,
              idempotencyKey: `native-booking-confirmation:${booking.id}`,
              templateData: {
                guestName: booking.guest_name,
                tentName: (booking as any).unit?.name,
                checkin: booking.checkin_date,
                checkout: booking.checkout_date,
                total: booking.total_amount,
                paymentRef: booking.payment_ref,
                guestToken: booking.guest_token,
                lang: booking.language,
              },
            }),
          }).catch((mailError) => console.error('native confirmation email request failed', mailError))
        }

        return json({ received: true, nativeBooking: booking?.id, paid: Boolean(booking) })
      }

      if (event.type === 'checkout.session.expired') {
        const { error } = await supabase
          .from('be_bookings')
          .update({ status: 'cancelled', payment_expires_at: null, updated_at: new Date().toISOString() })
          .eq('id', nativeBookingId)
          .eq('payment_status', 'pending')
        if (error) console.error('native booking expiry failed', error)
        return json({ received: true, nativeBooking: nativeBookingId, cancelled: !error })
      }

      return json({ received: true, nativeBooking: nativeBookingId, ignored: event.type })
    }

    // Existing add-on payment path remains unchanged.
    if (event.type === 'checkout.session.completed') {
      const res = await fetch(`${supabaseUrl}/functions/v1/verify-addon-payment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      const payload = await res.json().catch(() => ({}))
      console.log('verify addon via webhook', sessionId, res.status, payload)
      return json({ received: true, verified: res.ok })
    }

    if (event.type === 'checkout.session.expired') {
      const { error } = await supabase
        .from('addon_orders')
        .update({ status: 'cancelled' })
        .eq('stripe_session_id', sessionId)
        .eq('status', 'pending')
      if (error) console.error('cancel expired addon orders failed', error)
      return json({ received: true, cancelled: !error })
    }

    return json({ received: true, ignored: event.type })
  } catch (err) {
    console.error('webhook handler failed', err)
    return json({ error: 'handler_failed' }, 500)
  }
})
