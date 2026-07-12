// Public aggregate stats endpoint for the StayBoost case study.
// SELECT-only, returns only aggregated non-personal numbers.
// No booking numbers, names, emails, phones, raw payloads or payment ids.
import { createClient } from 'npm:@supabase/supabase-js@2'

const ALLOWED_ORIGINS = new Set([
  'https://stayboost-sverige.lovable.app',
  'https://goglampingsweden.se',
  'https://www.goglampingsweden.se',
  'https://bergsslussarglamping.lovable.app',
  'https://id-preview--f19a8ea0-7fa0-4bbb-8761-bb6eb3700748.lovable.app',
])

function corsFor(origin: string | null): Record<string, string> {
  const allow =
    origin && (ALLOWED_ORIGINS.has(origin) ||
      /^https:\/\/[a-z0-9-]+\.lovable\.app$/i.test(origin) ||
      /^http:\/\/localhost(:\d+)?$/i.test(origin) ||
      /^http:\/\/127\.0\.0\.1(:\d+)?$/i.test(origin))
      ? origin
      : 'https://stayboost-sverige.lovable.app'
  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

// Simple in-memory rate limit: 60 requests per IP per minute.
const bucket = new Map<string, { count: number; reset: number }>()
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const win = 60_000
  const max = 60
  const entry = bucket.get(ip)
  if (!entry || entry.reset < now) {
    bucket.set(ip, { count: 1, reset: now + win })
    if (bucket.size > 5000) {
      for (const [k, v] of bucket) if (v.reset < now) bucket.delete(k)
    }
    return false
  }
  entry.count++
  return entry.count > max
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

async function safeCount(table: string, filter?: (q: any) => any): Promise<number> {
  try {
    let q: any = supabase.from(table).select('*', { count: 'exact', head: true })
    if (filter) q = filter(q)
    const { count, error } = await q
    if (error) return 0
    return count ?? 0
  } catch { return 0 }
}

async function safeRows<T = any>(table: string, select: string, filter?: (q: any) => any): Promise<T[]> {
  try {
    let q: any = supabase.from(table).select(select)
    if (filter) q = filter(q)
    const { data, error } = await q
    if (error) return []
    return (data ?? []) as T[]
  } catch { return [] }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const cors = corsFor(origin)
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  if (rateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), {
      status: 429, headers: { ...cors, 'Content-Type': 'application/json', 'Retry-After': '60' },
    })
  }

  // Bookings 2026
  const bookings2026 = await safeRows<any>(
    'bookings',
    'id, checkin_date, checkout_date, nights, amount, email, phone',
    (q) => q.gte('checkin_date', '2026-01-01').lt('checkin_date', '2027-01-01'),
  )
  const bookingsCount = bookings2026.length
  let guestNights = 0
  let bookingValue = 0
  const guestKeys = new Set<string>()
  for (const b of bookings2026) {
    const nights = typeof b.nights === 'number' && b.nights > 0
      ? b.nights
      : (b.checkin_date && b.checkout_date
        ? Math.max(0, Math.round((new Date(b.checkout_date).getTime() - new Date(b.checkin_date).getTime()) / 86400000))
        : 0)
    guestNights += nights
    bookingValue += Number(b.amount ?? 0) || 0
    const key = (b.email || b.phone || '').toString().trim().toLowerCase()
    if (key) guestKeys.add(key)
  }
  const uniqueGuests = guestKeys.size

  // Paid addon orders
  const paidOrders = await safeRows<any>(
    'addon_orders',
    'id, total_sek, quantity, addon_id',
    (q) => q.in('status', ['paid', 'confirmed']),
  )
  const paidOrderCount = paidOrders.length
  const paidOrderRevenue = paidOrders.reduce((s, o) => s + (Number(o.total_sek) || 0), 0)
  const avgPaidOrder = paidOrderCount ? Math.round(paidOrderRevenue / paidOrderCount) : 0

  // Addon distribution (names only; no personal data)
  const addons = await safeRows<any>('addons', 'id, slug, name_sv, name_en')
  const addonMap = new Map(addons.map((a) => [a.id, a]))
  const distMap = new Map<string, { slug: string; name: string; orders: number; units: number; revenue: number }>()
  for (const o of paidOrders) {
    const a = addonMap.get(o.addon_id)
    if (!a) continue
    const key = a.slug
    const cur = distMap.get(key) ?? { slug: a.slug, name: a.name_sv || a.name_en || a.slug, orders: 0, units: 0, revenue: 0 }
    cur.orders += 1
    cur.units += Number(o.quantity) || 0
    cur.revenue += Number(o.total_sek) || 0
    distMap.set(key, cur)
  }
  const addonDistribution = Array.from(distMap.values()).sort((a, b) => b.revenue - a.revenue)

  // Prearrival (5-day) messages
  const prearrivalSent = await safeCount('bookings', (q) => q.not('reminder_5d_sent_at', 'is', null))
  const prearrivalTotal = await safeCount('bookings')

  // Digital check-ins
  const checkIns = await safeCount('check_ins')

  // Breakfast deliveries
  const breakfastDone = await safeCount('breakfast_deliveries', (q) => q.eq('status', 'delivered'))
  const breakfastTotal = await safeCount('breakfast_deliveries')

  // SMS
  const smsSent = await safeCount('sms_outbox', (q) => q.eq('status', 'sent'))
  const smsTotal = await safeCount('sms_outbox')

  // Traffic
  const pageViews = await safeCount('page_views')
  const clickEvents = await safeCount('click_events')
  const sessionRows = await safeRows<any>('page_views', 'session_id')
  const sessions = new Set(sessionRows.map((r) => r.session_id).filter(Boolean)).size

  const body = {
    bookings2026: bookingsCount,
    uniqueGuests,
    guestNights,
    bookingValueSek: Math.round(bookingValue),
    paidAddonOrders: paidOrderCount,
    paidAddonRevenueSek: Math.round(paidOrderRevenue),
    avgPaidAddonSek: avgPaidOrder,
    prearrivalMessages: { sent: prearrivalSent, total: prearrivalTotal },
    digitalCheckIns: checkIns,
    breakfastDeliveries: { done: breakfastDone, total: breakfastTotal },
    sms: { sent: smsSent, total: smsTotal },
    traffic: { pageViews, sessions, clickEvents },
    addonDistribution,
    updatedAt: new Date().toISOString(),
  }

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      ...cors,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  })
})
