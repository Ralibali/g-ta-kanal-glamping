import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Sends Karin a digest of upcoming breakfast/fika deliveries.
// Triggered by pg_cron twice weekly. Window defaults to next 7 days.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  let windowDays = 7
  try {
    const body = await req.json()
    if (typeof body?.window_days === 'number') windowDays = body.window_days
  } catch { /* no body */ }

  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const today = fmt.format(new Date())
  const end = new Date(new Date(today).getTime() + windowDays * 86400000)
  const endStr = fmt.format(end)

  const { data: stays } = await supabase
    .from('tent_stays')
    .select('booking_number, tent_id, checkin_date, checkout_date, guests, adults, children, breakfast, fikapase, guest_name, dietary, dietary_note')
    .or('breakfast.eq.true,fikapase.eq.true')
    .gte('checkout_date', today)
    .lte('checkin_date', endStr)

  const TENT_NAMES: Record<string, string> = {
    sjobris: 'Sjöbrisretreatet',
    naturkarnan: 'Naturkärnan',
    lugnetsyta: 'Lugnets Yta',
  }

  type Row = {
    date: string; tentName: string; bookingNumber: string | null; guestName: string | null;
    guests: number; kind: 'breakfast' | 'fikapase'; dietary: string[]; dietaryNote: string | null;
  }
  const rows: Row[] = []
  for (const s of (stays ?? []) as any[]) {
    const tentName = TENT_NAMES[s.tent_id] ?? s.tent_id
    const guests = s.guests ?? s.adults ?? 0
    const base = {
      tentName, bookingNumber: s.booking_number, guestName: s.guest_name,
      guests, dietary: s.dietary ?? [], dietaryNote: s.dietary_note ?? null,
    }
    if (s.fikapase && s.checkin_date >= today && s.checkin_date <= endStr) {
      rows.push({ ...base, date: s.checkin_date, kind: 'fikapase' })
    }
    if (s.breakfast && s.checkout_date >= today && s.checkout_date <= endStr) {
      rows.push({ ...base, date: s.checkout_date, kind: 'breakfast' })
    }
  }
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.tentName.localeCompare(b.tentName))

  const windowLabel = windowDays <= 4 ? 'kommande dagar' : `kommande ${windowDays} dagar`

  try {
    await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateName: 'breakfast-digest',
        recipientEmail: 'Info@bostallets.se',
        idempotencyKey: `breakfast-digest-${today}`,
        templateData: { windowLabel, rows },
      }),
    })
  } catch (err) {
    console.error('digest send failed', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ success: true, count: rows.length, window: { from: today, to: endStr } }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
