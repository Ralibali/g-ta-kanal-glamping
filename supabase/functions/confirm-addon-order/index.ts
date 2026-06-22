import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Admin-only: marks an addon order as confirmed/paid and, if it's an early_checkin,
// sets/clears the early-checkin flag on the cleaning sort.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const caller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
  const { data: claims } = await caller.auth.getClaims(authHeader.replace('Bearer ', ''))
  const userId = claims?.claims?.sub
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  const supabase = createClient(supabaseUrl, serviceKey)
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', userId)
  if (!(roles ?? []).some((r: any) => r.role === 'admin')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  let body: { order_id?: string; action?: 'confirm' | 'cancel' } = {}
  try { body = await req.json() } catch {}
  const orderId = body.order_id
  const action = body.action ?? 'confirm'
  if (!orderId) {
    return new Response(JSON.stringify({ error: 'order_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { data: order } = await supabase
    .from('addon_orders')
    .select('id, booking_id, addon_id, status, addons:addon_id(slug), bookings:booking_id(tent_id, checkin_date)')
    .eq('id', orderId)
    .maybeSingle() as any
  if (!order) {
    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const isEarly = order.addons?.slug === 'early_checkin'
  const newStatus = action === 'confirm' ? (isEarly ? 'confirmed' : 'paid') : 'cancelled'
  await supabase.from('addon_orders')
    .update({ status: newStatus, paid_at: action === 'confirm' ? new Date().toISOString() : null })
    .eq('id', orderId)

  if (isEarly) {
    if (action === 'confirm') {
      await supabase.from('early_checkin_flags').upsert({
        tent_id: order.bookings.tent_id,
        date: order.bookings.checkin_date,
        booking_id: order.booking_id,
        active: true,
      }, { onConflict: 'tent_id,date' })
    } else {
      await supabase.from('early_checkin_flags')
        .update({ active: false })
        .eq('tent_id', order.bookings.tent_id)
        .eq('date', order.bookings.checkin_date)
    }
  }

  return new Response(JSON.stringify({ success: true, status: newStatus }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
