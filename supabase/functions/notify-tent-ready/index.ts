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

interface Addons {
  breakfast: boolean
  fikapase: boolean
}

function svMessage(name: string | null, tentName: string, flags: Addons): string {
  const greet = name ? `Hej ${name}` : 'Hej'
  let s = `${greet} och välkommen till oss på Bergs Slussar Glamping! Våra städare har markerat ${tentName} som klart, så ni är välkomna att checka in från nu. Incheckning sker via QR-koden vid entrén, där kan ni checka in med namn eller bokningsnummer och får sedan koden till tältet.`
  if (flags.breakfast) s += `\n\nDu har frukost inkluderat. Den serveras mellan 08:30–09:00 vid portalen halvvägs upp för backen. Du får ett SMS så fort frukosten är levererad direkt från bageriet.`
  if (flags.fikapase) s += `\n\nDin välkomst-fikapåse står redo i tältet.`
  s += `\n\nSoliga hälsningar, Bergs Slussar Glamping`
  return s
}

function enMessage(name: string | null, tentName: string, flags: Addons): string {
  const greet = name ? `Hi ${name}` : 'Hi'
  let s = `${greet} and welcome to Bergs Slussar Glamping! Our cleaners have marked ${tentName} as ready, so you are welcome to check in from now. Check in via the QR code at the entrance, where you can use your name or booking number, and you will then get the code to your tent.`
  if (flags.breakfast) s += `\n\nBreakfast is included. It is served between 08:30–09:00 at the portal halfway up the hill. You'll get an SMS as soon as it has been delivered fresh from the bakery.`
  if (flags.fikapase) s += `\n\nYour welcome fika bag is waiting in your tent.`
  s += `\n\nKind regards, Bergs Slussar Glamping`
  return s
}

function deMessage(name: string | null, tentName: string, flags: Addons): string {
  const greet = name ? `Hallo ${name}` : 'Hallo'
  let s = `${greet} und herzlich willkommen im Bergs Slussar Glamping!\n\nUnsere Reinigungskräfte haben ${tentName} als fertig markiert, sodass Sie ab sofort einchecken können. Der Check-in erfolgt über den QR-Code am Eingang – dort können Sie mit Name oder Buchungsnummer einchecken und erhalten dann den Code zu Ihrem Zelt.`
  if (flags.breakfast) s += `\n\nSie haben Frühstück inklusive. Es wird zwischen 08:30–09:00 am Portal auf halbem Weg den Hügel hinauf serviert. Sie erhalten eine SMS, sobald das Frühstück frisch vom Bäcker geliefert wurde.`
  if (flags.fikapase) s += `\n\nIhre Willkommens-Fika-Tüte steht in Ihrem Zelt bereit.`
  s += `\n\nBei Fragen? Schreiben Sie Christoffer per SMS an +46 722 25 49 93.\n\nFreundliche Grüße\nBergs Slussar Glamping`
  return s
}

function noMessage(name: string | null, tentName: string, flags: Addons): string {
  const greet = name ? `Hei ${name}` : 'Hei'
  let s = `${greet} og velkommen til Bergs Slussar Glamping!\n\nRengjøringspersonalet vårt har markert ${tentName} som klart, så du kan sjekke inn fra nå av. Innsjekking skjer via QR-koden ved inngangen – der kan du sjekke inn med navn eller bestillingsnummer, og får deretter koden til teltet.`
  if (flags.breakfast) s += `\n\nDu har frokost inkludert. Den serveres mellom 08:30–09:00 ved portalen halvveis opp bakken. Du får en SMS så snart frokosten er levert direkte fra bakeriet.`
  if (flags.fikapase) s += `\n\nVelkomst-fikaposen din ligger klar i teltet ditt.`
  s += `\n\nHar du spørsmål? Send SMS til Christoffer på +46 722 25 49 93.\n\nVennlig hilsen\nBergs Slussar Glamping`
  return s
}

function daMessage(name: string | null, tentName: string, flags: Addons): string {
  const greet = name ? `Hej ${name}` : 'Hej'
  let s = `${greet} og velkommen til Bergs Slussar Glamping!\n\nVores rengøringspersonale har markeret ${tentName} som klar, så du er velkommen til at tjekke ind fra nu. Tjek ind via QR-koden ved indgangen – der kan du tjekke ind med navn eller bookingsnummer, og får derefter koden til dit telt.`
  if (flags.breakfast) s += `\n\nDu har morgenmad inkluderet. Den serveres mellem 08:30–09:00 ved portalen halvvejs op ad bakken. Du får en SMS, så snart morgenmaden er leveret direkte fra bageriet.`
  if (flags.fikapase) s += `\n\nDin velkomst-fikapose ligger klar i dit telt.`
  s += `\n\nHar du spørgsmål? Skriv til Christoffer på SMS +46 722 25 49 93.\n\nVenlig hilsen\nBergs Slussar Glamping`
  return s
}

function nlMessage(name: string | null, tentName: string, flags: Addons): string {
  const greet = name ? `Hoi ${name}` : 'Hoi'
  let s = `${greet} en welkom bij Bergs Slussar Glamping!\n\nOnze schoonmakers hebben ${tentName} als klaar gemarkeerd, dus je kunt vanaf nu inchecken. Check in via de QR-code bij de ingang – daar kun je inchecken met naam of boekingsnummer, en ontvang dan de code voor je tent.`
  if (flags.breakfast) s += `\n\nJe hebt ontbijt inbegrepen. Het wordt tussen 08:30–09:00 geserveerd bij het portaal halverwege de heuvel. Je krijgt een sms zodra het ontbijt vers van de bakker is geleverd.`
  if (flags.fikapase) s += `\n\nJe welkomst-fikatas staat klaar in je tent.`
  s += `\n\nVragen? Stuur Christoffer een sms op +46 722 25 49 93.\n\nMet vriendelijke groet\nBergs Slussar Glamping`
  return s
}

function buildMessage(lang: string, name: string | null, tentName: string, breakfast: boolean, fikapase: boolean): string {
  const builders: Record<string, (name: string | null, tentName: string, flags: Addons) => string> = {
    sv: svMessage, en: enMessage, de: deMessage, no: noMessage, da: daMessage, nl: nlMessage,
  }
  const key = (lang ?? '').toLowerCase()
  const builder = builders[key] ?? enMessage
  return builder(name, tentName, { breakfast, fikapase })
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

  const todayStockholm = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())

  if (cleaning_date !== todayStockholm) {
    smsStatus = 'skipped'
    smsReason = 'not_today'
  } else if (!arrival) {
    smsStatus = 'skipped'
    smsReason = 'no_arrival_today'
  } else {
    const toPhone = normalizePhone(arrival.phone)
    const lang = (arrival.lang ?? 'sv').toLowerCase()
    const name = arrival.guest_name
    const messageBody = buildMessage(lang, name, tentMeta.name, !!arrival.breakfast, !!arrival.fikapase)

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
            status: 'sent', sent_at: new Date().toISOString(), provider_id: result.id, error: null,
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
