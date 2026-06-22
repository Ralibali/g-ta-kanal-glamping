import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const TENT_NAMES: Record<string, { no: number; name: string }> = {
  sjobris: { no: 1, name: 'Sjöbrisretreatet' },
  naturkarnan: { no: 2, name: 'Naturkärnan' },
  lugnetsyta: { no: 3, name: 'Lugnets yta' },
}

const SMS_TEMPLATES: Record<string, string> = {
  sv: '', // built dynamically for Swedish to include name
  en: 'Hi! Your tent {tent} at Bergs Slussar Glamping is now cleaned and ready for check-in. Warm welcome! Questions? Text 0722254993.',
  da: 'Hej! Dit telt {tent} på Bergs Slussar Glamping er nu rengjort og klar til check-in. Velkommen! Spørgsmål? Sms 0722254993.',
  no: 'Hei! Teltet ditt {tent} på Bergs Slussar Glamping er nå rengjort og klart for innsjekk. Velkommen! Spørsmål? Send SMS 0722254993.',
  de: 'Hallo! Ihr Zelt {tent} im Bergs Slussar Glamping ist jetzt gereinigt und bereit zum Check-in. Willkommen! Fragen? SMS an 0722254993.',
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
  const user = Deno.env.get('ELKS46_USERNAME') ?? Deno.env.get('ELKS_API_USERNAME')
  const pass = Deno.env.get('ELKS46_PASSWORD') ?? Deno.env.get('ELKS_API_PASSWORD')
  if (!user || !pass) throw new Error('NO_PROVIDER')
  const auth = btoa(`${user}:${pass}`)
  const res = await fetch('https://api.46elks.com/a1/sms', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      from: ((Deno.env.get('ELKS46_FROM') || Deno.env.get('ELKS_FROM') || 'GoGlamping').replace(/[^A-Za-z0-9]/g, '').slice(0, 11)) || 'Glamping',
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

  // Auth: allow service role (internal calls) or validate caller (cleaner or admin)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const token = authHeader.replace('Bearer ', '')
  const isServiceRole = token === serviceKey
  if (!isServiceRole) {
    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: claims, error: claimsErr } = await callerClient.auth.getClaims(token)
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const userId = claims.claims.sub
    const supabaseTmp = createClient(supabaseUrl, serviceKey)
    const { data: roleRows } = await supabaseTmp
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
    const roles = (roleRows ?? []).map((r: { role: string }) => r.role)
    if (!roles.includes('cleaner') && !roles.includes('admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  let body: { tent_id?: string; cleaning_date?: string; session_id?: string } = {}

  try { body = await req.json() } catch { /* ignore */ }
  const tent_id = body.tent_id
  const cleaning_date = body.cleaning_date
  if (!tent_id || !cleaning_date) {
    return new Response(JSON.stringify({ error: 'tent_id and cleaning_date required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const tentMeta = TENT_NAMES[tent_id] ?? { no: 0, name: tent_id }

  // Look up today's arrival in this tent
  const { data: stays } = await supabase
    .from('tent_stays')
    .select('*')
    .eq('tent_id', tent_id)
    .eq('checkin_date', cleaning_date)
    .limit(1)

  const arrival = (stays ?? [])[0] as
    | { booking_number: string; guest_name: string | null; phone: string | null; email: string | null; lang: string | null; guests: number | null; breakfast: boolean; fikapase: boolean; late_checkout: boolean }
    | undefined

  // Fetch session + issues for the email
  const { data: session } = await supabase
    .from('cleaning_sessions')
    .select('*')
    .eq('tent_id', tent_id)
    .eq('cleaning_date', cleaning_date)
    .maybeSingle() as any
  const sessionId = body.session_id || session?.id || null

  let issues: { description: string; photo_path: string | null }[] = []
  if (sessionId) {
    const { data } = await supabase
      .from('cleaning_issues')
      .select('description, photo_path')
      .eq('session_id', sessionId)
    issues = (data ?? []) as any
  }

  // Sign photo URLs (1h)
  const emailIssues = await Promise.all(issues.map(async (it) => {
    let photoUrl: string | undefined
    if (it.photo_path) {
      const { data } = await supabase.storage.from('cleaning-photos').createSignedUrl(it.photo_path, 60 * 60)
      photoUrl = data?.signedUrl
    }
    return { description: it.description, photoUrl }
  }))

  let smsStatus = 'skipped'
  let smsReason: string | null = null

  if (!arrival) {
    smsStatus = 'skipped'
    smsReason = 'no_arrival_today'
  } else {
    const toPhone = normalizePhone(arrival.phone)
    const lang = (arrival.lang ?? 'sv').toLowerCase()
    const name = arrival.guest_name
    let messageBody: string
    if (lang === 'sv') {
      const greeting = name ? `Hej ${name}` : 'Hej'
      messageBody = `${greeting} och välkommen till oss på Bergs Slussar Glamping! ☀️\n\nVåra städare har markerat erat tält som klart, vilket gör att ni är välkomna från nu. Ni checkar in via QR-koden som finns vid entrén och därigenom så får ni koden till erat tält. Bokningskoden hittar du i din mail.\n\nHar ni beställt frukost då serveras det mellan 08:30-09:00 och finns vid portalen halvvägs upp i backen. Om ni har beställt fikapåse så finns det redo i erat tält!\n\nHar ni några frågor? Hör av er till Christoffer per SMS på 0722254993.\n\nVänligen\n\nBergs slussar Glamping 🏕️`
    } else {
      const greeting = name ? `Hi ${name}` : 'Hi'
      messageBody = `${greeting} and welcome to Bergs Slussar Glamping! ☀️\n\nOur cleaners have marked your tent as ready, so you are welcome to check in from now. Please check in via the QR code at the entrance — you will then receive the code to your tent. Your booking number is in your email.\n\nIf you have ordered breakfast, it is served between 08:30-09:00 at the portal halfway up the hill. If you have ordered a coffee/snack bag (fikapåse), it is ready in your tent!\n\nAny questions? Text Christoffer on +46 722 25 49 93.\n\nKind regards\n\nBergs Slussar Glamping 🏕️`
    }

    if (!toPhone) {
      // Insert failed row (idempotent)
      const { data: existing } = await supabase
        .from('sms_outbox')
        .select('id, status')
        .eq('tent_id', tent_id)
        .eq('cleaning_date_key', cleaning_date)
        .maybeSingle() as any
      if (!existing) {
        await supabase.from('sms_outbox').insert({
          booking_number: arrival.booking_number,
          tent_id, cleaning_date_key: cleaning_date,
          to_phone: null, lang, body: messageBody,
          status: 'failed', error: 'missing_phone',
        } as any)
      }
      smsStatus = 'failed'
      smsReason = 'missing_phone'
    } else {
      // Idempotent insert
      const { data: existing } = await supabase
        .from('sms_outbox')
        .select('id, status')
        .eq('tent_id', tent_id)
        .eq('cleaning_date_key', cleaning_date)
        .maybeSingle() as any

      let outboxId = existing?.id
      if (!existing) {
        const { data: ins } = await supabase.from('sms_outbox').insert({
          booking_number: arrival.booking_number,
          tent_id, cleaning_date_key: cleaning_date,
          to_phone: toPhone, lang, body: messageBody,
          status: 'queued',
        } as any).select('id').single()
        outboxId = (ins as any)?.id
      } else if (existing.status === 'sent') {
        smsStatus = 'sent'
      }

      if (smsStatus !== 'sent') {
        try {
          const result = await sendSms(toPhone, messageBody)
          await supabase.from('sms_outbox').update({
            status: 'sent', sent_at: new Date().toISOString(), provider_id: result.id,
          } as any).eq('id', outboxId)
          smsStatus = 'sent'
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          if (msg === 'NO_PROVIDER') {
            smsStatus = 'queued'
            smsReason = 'no_provider_configured'
          } else {
            await supabase.from('sms_outbox').update({
              status: 'failed', error: msg,
            } as any).eq('id', outboxId)
            smsStatus = 'failed'
            smsReason = msg
          }
        }
      }
    }
  }

  // Send guest welcome email (if email present)
  let guestEmailStatus = 'skipped'
  if (arrival?.email) {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateName: 'tent-ready-guest',
          recipientEmail: arrival.email,
          idempotencyKey: `tent-ready-guest-${tent_id}-${cleaning_date}`,
          templateData: {
            guestName: arrival.guest_name,
            tentName: tentMeta.name,
            tentNo: tentMeta.no,
            breakfast: !!arrival.breakfast,
            fikapase: !!arrival.fikapase,
            lang: arrival.lang ?? 'sv',
          },
        }),
      })
      guestEmailStatus = res.ok ? 'sent' : `failed (${res.status})`
    } catch (err) {
      guestEmailStatus = `failed (${err instanceof Error ? err.message : String(err)})`
    }
  } else if (arrival) {
    guestEmailStatus = 'missing_email'
  } else {
    guestEmailStatus = 'no_arrival'
  }

  // Send admin email (always)
  const completedAt = session?.completed_at
    ? new Date(session.completed_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })

  try {
    await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateName: 'cleaning-complete',
        idempotencyKey: `cleaning-${tent_id}-${cleaning_date}`,
        templateData: {
          tentName: tentMeta.name,
          tentNo: tentMeta.no,
          date: cleaning_date,
          completedAt,
          hasArrival: !!arrival,
          guests: arrival?.guests ?? null,
          bookingNumber: arrival?.booking_number ?? null,
          breakfast: !!arrival?.breakfast,
          fikapase: !!arrival?.fikapase,
          lateCheckout: !!arrival?.late_checkout,
          smsStatus: smsReason ? `${smsStatus} (${smsReason})` : smsStatus,
          guestEmailStatus,
          issues: emailIssues,
          adminUrl: 'https://goglampingsweden.se/admin',
        },
      }),
    })
  } catch (err) {
    console.error('Failed to send admin email', err)
  }

  return new Response(JSON.stringify({
    success: true,
    sms_status: smsStatus,
    sms_reason: smsReason,
    guest_email_status: guestEmailStatus,
    has_arrival: !!arrival,
  }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
