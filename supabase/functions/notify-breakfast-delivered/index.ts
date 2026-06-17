import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const TENT_NAMES: Record<string, { no: number; name: string }> = {
  sjobris: { no: 1, name: 'Sjöbrisretreatet' },
  naturkarnan: { no: 2, name: 'Naturkärnan' },
  lugnetsyta: { no: 3, name: 'Lugnets yta' },
}

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.replace(/[\s\-()]/g, '')
  if (!trimmed) return null
  if (trimmed.startsWith('+')) return trimmed
  if (trimmed.startsWith('00')) return '+' + trimmed.slice(2)
  if (trimmed.startsWith('0')) return '+46' + trimmed.slice(1)
  return '+' + trimmed
}

async function sendSms(toPhone: string, body: string): Promise<{ id: string }> {
  const user = Deno.env.get('ELKS46_USERNAME')
  const pass = Deno.env.get('ELKS46_PASSWORD')
  if (!user || !pass) throw new Error('NO_PROVIDER')
  const auth = btoa(`${user}:${pass}`)
  const res = await fetch('https://api.46elks.com/a1/sms', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      from: Deno.env.get('ELKS46_FROM') || 'GoGlamping',
      to: toPhone,
      message: body,
    }),
  })
  if (!res.ok) throw new Error(`46elks ${res.status}: ${await res.text()}`)
  const json = await res.json()
  return { id: json.id ?? '' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
  const { data: claims, error: claimsErr } = await callerClient.auth.getClaims(authHeader.replace('Bearer ', ''))
  if (claimsErr || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const userId = claims.claims.sub

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
  const roles = (roleRows ?? []).map((r: { role: string }) => r.role)
  if (!roles.includes('breakfast') && !roles.includes('admin')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  let body: { booking_number?: string; delivery_date?: string; kind?: string } = {}
  try { body = await req.json() } catch { /* ignore */ }
  const booking_number = body.booking_number
  const delivery_date = body.delivery_date
  const kind = body.kind ?? 'breakfast'
  if (!booking_number || !delivery_date) {
    return new Response(JSON.stringify({ error: 'booking_number and delivery_date required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Look up booking
  const { data: stays } = await supabase
    .from('tent_stays')
    .select('*')
    .eq('booking_number', booking_number)
    .limit(1)
  const stay = (stays ?? [])[0] as
    | { booking_number: string; tent_id: string; guest_name: string | null; phone: string | null; lang: string | null }
    | undefined

  if (!stay) {
    return new Response(JSON.stringify({ error: 'booking not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const tentMeta = TENT_NAMES[stay.tent_id] ?? { no: 0, name: stay.tent_id }
  const lang = (stay.lang ?? 'sv').toLowerCase()
  const name = stay.guest_name?.split(' ')[0]

  let message: string
  if (kind === 'fikapase') {
    message = lang === 'sv'
      ? `${name ? `Hej ${name}!` : 'Hej!'} Din fikapåse är nu levererad och finns i backen vid portalen. Smaklig fika! 🌿\n\nBergs Slussar Glamping`
      : `${name ? `Hi ${name}!` : 'Hi!'} Your fika bag has been delivered and is waiting in the basket at the portal. Enjoy! 🌿\n\nBergs Slussar Glamping`
  } else {
    message = lang === 'sv'
      ? `${name ? `Hej ${name}!` : 'Hej!'} Frukosten är nu levererad och står i backen vid portalen halvvägs upp i backen. Smaklig frukost! 🥐☕\n\nBergs Slussar Glamping`
      : `${name ? `Hi ${name}!` : 'Hi!'} Your breakfast has been delivered and is waiting in the basket at the portal halfway up the hill. Enjoy! 🥐☕\n\nBergs Slussar Glamping`
  }

  const toPhone = normalizePhone(stay.phone)
  let smsStatus = 'skipped'
  let smsError: string | null = null

  if (!toPhone) {
    smsStatus = 'failed'
    smsError = 'missing_phone'
  } else {
    try {
      await sendSms(toPhone, message)
      smsStatus = 'sent'
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      smsStatus = msg === 'NO_PROVIDER' ? 'queued' : 'failed'
      smsError = msg
    }
  }

  // Upsert delivery record
  await supabase.from('breakfast_deliveries').upsert({
    booking_number,
    tent_id: stay.tent_id,
    delivery_date,
    kind,
    status: 'delivered',
    delivered_at: new Date().toISOString(),
    delivered_by: userId,
    sms_status: smsStatus,
    sms_error: smsError,
  } as any, { onConflict: 'booking_number,delivery_date,kind' })

  return new Response(JSON.stringify({
    success: true,
    sms_status: smsStatus,
    sms_error: smsError,
    tent: tentMeta,
  }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
