import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@18.5.0'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const nightsBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const overlaps = (aFrom: string, aTo: string, bFrom: string, bTo: string) =>
  aFrom < bTo && aTo > bFrom

function nightlyPrice(unit: any, iso: string) {
  const date = new Date(`${iso}T12:00:00Z`)
  const month = date.getUTCMonth()
  const weekday = date.getUTCDay()
  const multipliers = Array.isArray(unit.monthly_mult) ? unit.monthly_mult.map(Number) : []
  const monthPct = Number(multipliers[month] ?? 100)
  const weekendPct = weekday === 5 || weekday === 6 ? Number(unit.weekend_pct ?? 0) : 0
  const seasonal = Number(unit.base_price ?? 0) * (monthPct / 100)
  return Math.max(0, Math.round(seasonal * (1 + weekendPct / 100)))
}

function quoteStay(unit: any, checkin: string, checkout: string) {
  const nights = nightsBetween(checkin, checkout)
  let accommodation = 0
  const nightly: { date: string; price: number }[] = []
  for (let i = 0; i < nights; i++) {
    const date = addDays(checkin, i)
    const price = nightlyPrice(unit, date)
    nightly.push({ date, price })
    accommodation += price
  }
  const cleaning = Number(unit.cleaning_fee ?? 0)
  return { nights, nightly, accommodation, cleaning, total: accommodation + cleaning }
}

function addonLineTotal(addon: any, quantity: number, nights: number, guests: number) {
  const price = Number(addon.price ?? 0)
  switch (addon.price_type) {
    case 'per_night': return price * quantity * nights
    case 'per_person': return price * quantity * guests
    case 'per_person_per_night': return price * quantity * guests * nights
    default: return price * quantity
  }
}

function safeReturnPath(value: unknown) {
  const path = typeof value === 'string' ? value : '/boka'
  return ['/boka', '/en/boka', '/en/book', '/de/boka', '/de/buchen'].includes(path) ? path : '/boka'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (!['GET', 'POST'].includes(req.method)) return json({ error: 'method_not_allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return json({ error: 'server_not_configured' }, 500)

  const supabase = createClient(supabaseUrl, serviceKey)

  // Holds that never reached payment stop blocking inventory after expiry.
  await supabase
    .from('be_bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('status', 'confirmed')
    .eq('payment_status', 'pending')
    .lt('payment_expires_at', new Date().toISOString())

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('session_id')

    if (sessionId) {
      const { data: booking } = await supabase
        .from('be_bookings')
        .select('id,status,payment_status,payment_ref,total_amount,guest_token,checkin_date,checkout_date,unit:be_units(name)')
        .eq('stripe_session_id', sessionId)
        .maybeSingle()
      if (!booking) return json({ error: 'booking_not_found' }, 404)
      return json({ booking })
    }

    const slug = url.searchParams.get('slug')?.trim()
    if (!slug) return json({ error: 'slug_required' }, 400)

    const { data: property } = await supabase
      .from('be_properties')
      .select('id,name,slug,currency,checkin_time,checkout_time,contact_email,contact_phone')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle()
    if (!property) return json({ error: 'property_not_found' }, 404)

    const [{ data: units }, { data: addons }] = await Promise.all([
      supabase
        .from('be_units')
        .select('id,name,description,capacity,base_price,weekend_pct,min_stay,cleaning_fee,monthly_mult,legacy_tent_id,sort_order')
        .eq('property_id', property.id)
        .eq('active', true)
        .order('sort_order'),
      supabase
        .from('be_addons')
        .select('id,name,name_en,description,description_en,price,price_type,max_quantity,slug,sort_order')
        .eq('property_id', property.id)
        .eq('active', true)
        .order('sort_order'),
    ])

    const unitIds = (units ?? []).map((unit: any) => unit.id)
    let booked: any[] = []
    if (unitIds.length) {
      const result = await supabase
        .from('be_bookings')
        .select('unit_id,checkin_date,checkout_date,payment_status,payment_expires_at')
        .in('unit_id', unitIds)
        .eq('status', 'confirmed')
      booked = result.data ?? []
    }

    const now = Date.now()
    const rangesByUnit = new Map<string, { from: string; to: string }[]>()
    for (const row of booked) {
      if (
        row.payment_status === 'pending' &&
        row.payment_expires_at &&
        Date.parse(row.payment_expires_at) <= now
      ) continue
      const ranges = rangesByUnit.get(row.unit_id) ?? []
      ranges.push({ from: row.checkin_date, to: row.checkout_date })
      rangesByUnit.set(row.unit_id, ranges)
    }

    return json({
      property: {
        name: property.name,
        slug: property.slug,
        currency: property.currency,
        checkinTime: property.checkin_time,
        checkoutTime: property.checkout_time,
        contactEmail: property.contact_email,
        contactPhone: property.contact_phone,
        stripeAvailable: Boolean(Deno.env.get('STRIPE_SECRET_KEY')),
      },
      units: (units ?? []).map((unit: any) => ({
        id: unit.id,
        name: unit.name,
        description: unit.description,
        maxGuests: unit.capacity,
        basePrice: unit.base_price,
        weekendPct: unit.weekend_pct,
        minStay: unit.min_stay,
        cleaningFee: unit.cleaning_fee,
        monthlyMult: unit.monthly_mult,
        booked: rangesByUnit.get(unit.id) ?? [],
      })),
      addons: addons ?? [],
    })
  }

  let body: any
  try { body = await req.json() } catch { return json({ error: 'invalid_json' }, 400) }

  if (body.website) return json({ ok: true }) // honeypot

  const slug = String(body.slug ?? '').trim()
  const unitId = String(body.unitId ?? '').trim()
  const checkin = String(body.checkin ?? '')
  const checkout = String(body.checkout ?? '')
  const guestName = String(body.guest_name ?? '').trim()
  const guestEmail = String(body.guest_email ?? '').trim().toLowerCase()
  const guestPhone = String(body.guest_phone ?? '').trim()
  const guests = Number(body.guests ?? 1)
  const language = ['sv', 'en', 'de'].includes(body.language) ? body.language : 'sv'
  const returnPath = safeReturnPath(body.returnPath)

  if (!slug || !unitId || !ISO_DATE.test(checkin) || !ISO_DATE.test(checkout)) {
    return json({ error: 'invalid_booking' }, 400)
  }
  if (checkout <= checkin || checkin < new Date().toISOString().slice(0, 10)) {
    return json({ error: 'invalid_dates' }, 400)
  }
  if (guestName.length < 2) return json({ error: 'name_required' }, 400)
  if (!EMAIL.test(guestEmail)) return json({ error: 'email_required' }, 400)
  if (!body.termsAccepted) return json({ error: 'terms_required' }, 400)

  const { data: property } = await supabase
    .from('be_properties')
    .select('id,name,slug,currency')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()
  if (!property) return json({ error: 'property_not_found' }, 404)

  const { data: unit } = await supabase
    .from('be_units')
    .select('*')
    .eq('id', unitId)
    .eq('property_id', property.id)
    .eq('active', true)
    .maybeSingle()
  if (!unit) return json({ error: 'unit_not_found' }, 404)
  if (!Number.isInteger(guests) || guests < 1 || guests > Number(unit.capacity ?? 1)) {
    return json({ error: 'capacity_exceeded', maxGuests: unit.capacity }, 400)
  }

  const quote = quoteStay(unit, checkin, checkout)
  if (quote.nights < Number(unit.min_stay ?? 1)) {
    return json({ error: 'min_stay', minStay: unit.min_stay }, 400)
  }
  if (quote.total <= 0) return json({ error: 'pricing_not_configured' }, 409)

  const { data: clashes } = await supabase
    .from('be_bookings')
    .select('id,checkin_date,checkout_date,payment_status,payment_expires_at')
    .eq('unit_id', unit.id)
    .eq('status', 'confirmed')
    .lt('checkin_date', checkout)
    .gt('checkout_date', checkin)

  const now = Date.now()
  const hasClash = (clashes ?? []).some((row: any) => {
    if (!overlaps(checkin, checkout, row.checkin_date, row.checkout_date)) return false
    return !(
      row.payment_status === 'pending' &&
      row.payment_expires_at &&
      Date.parse(row.payment_expires_at) <= now
    )
  })
  if (hasClash) return json({ error: 'unavailable' }, 409)

  const requestedAddons = Array.isArray(body.addons) ? body.addons : []
  const addonIds = requestedAddons
    .map((item: any) => String(item?.id ?? ''))
    .filter(Boolean)

  let addonRows: any[] = []
  if (addonIds.length) {
    const { data } = await supabase
      .from('be_addons')
      .select('*')
      .eq('property_id', property.id)
      .eq('active', true)
      .in('id', addonIds)
    addonRows = data ?? []
  }

  const selectedAddons: any[] = []
  let addonsTotal = 0
  for (const requested of requestedAddons) {
    const addon = addonRows.find((row: any) => row.id === requested.id)
    if (!addon) continue
    const quantity = Math.floor(Number(requested.quantity ?? 0))
    if (quantity < 1 || quantity > Number(addon.max_quantity ?? 10)) continue
    const lineTotal = addonLineTotal(addon, quantity, quote.nights, guests)
    addonsTotal += lineTotal
    selectedAddons.push({ addon, quantity, lineTotal })
  }

  const grandTotal = quote.total + addonsTotal
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
  const paymentRef = `GLP-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`

  const { data: booking, error: bookingError } = await supabase
    .from('be_bookings')
    .insert({
      property_id: property.id,
      unit_id: unit.id,
      source: 'direct',
      status: 'confirmed',
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone || null,
      guests,
      checkin_date: checkin,
      checkout_date: checkout,
      language,
      total_amount: grandTotal,
      addons_total: addonsTotal,
      payment_status: 'pending',
      payment_method: 'stripe',
      payment_amount: grandTotal,
      payment_ref: paymentRef,
      payment_expires_at: expiresAt.toISOString(),
    })
    .select('id,guest_token')
    .single()

  if (bookingError) {
    console.error('native booking insert failed', bookingError)
    if (bookingError.code === '23P01' || String(bookingError.message).includes('booking_overlap')) {
      return json({ error: 'unavailable' }, 409)
    }
    return json({ error: 'booking_failed' }, 500)
  }

  if (selectedAddons.length) {
    const { error: addonError } = await supabase.from('be_booking_addons').insert(
      selectedAddons.map(({ addon, quantity, lineTotal }) => ({
        booking_id: booking.id,
        addon_id: addon.id,
        quantity,
        unit_price: addon.price,
        line_total: lineTotal,
        price_type: addon.price_type,
      })),
    )
    if (addonError) {
      await supabase.from('be_bookings').update({ status: 'cancelled' }).eq('id', booking.id)
      console.error('native booking addons failed', addonError)
      return json({ error: 'booking_failed' }, 500)
    }
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    await supabase.from('be_bookings').update({ status: 'cancelled' }).eq('id', booking.id)
    return json({ error: 'stripe_not_configured' }, 503)
  }

  const baseUrl = (Deno.env.get('PUBLIC_BASE_URL') || 'https://goglampingsweden.se').replace(/\/$/, '')
  const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' })

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: guestEmail,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      success_url: `${baseUrl}${returnPath}?native=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${returnPath}?native=cancelled`,
      metadata: {
        kind: 'native_booking',
        booking_id: booking.id,
        payment_ref: paymentRef,
        property_slug: property.slug,
      },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: String(property.currency || 'SEK').toLowerCase(),
          unit_amount: grandTotal * 100,
          product_data: {
            name: `${property.name} – ${unit.name}`,
            description: `${checkin} – ${checkout} · ${quote.nights} ${quote.nights === 1 ? 'natt' : 'nätter'}`,
          },
        },
      }],
    })

    const { error: sessionError } = await supabase
      .from('be_bookings')
      .update({ stripe_session_id: session.id })
      .eq('id', booking.id)
    if (sessionError) throw sessionError

    return json({
      checkoutUrl: session.url,
      bookingId: booking.id,
      guestToken: booking.guest_token,
      paymentRef,
      grandTotal,
      price: quote,
      addonsTotal,
      expiresAt: expiresAt.toISOString(),
    }, 201)
  } catch (error) {
    console.error('stripe checkout creation failed', error)
    await supabase.from('be_bookings').update({ status: 'cancelled' }).eq('id', booking.id)
    return json({ error: 'stripe_failed' }, 502)
  }
})
