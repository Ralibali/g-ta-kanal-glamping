import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const USE_EMOJI = false

const TENT_NAMES: Record<string, string> = {
  sjobris: 'Sjöbrisretreatet',
  naturkarnan: 'Naturkärnan',
  lugnetsyta: 'Lugnets Yta',
}

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const t = raw.replace(/[\s\-()]/g, '')
  if (!t) return null
  if (t.startsWith('+')) return t
  if (t.startsWith('00')) return '+' + t.slice(2)
  if (t.startsWith('0')) return '+46' + t.slice(1)
  return '+' + t
}

const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
function genSlug(): string {
  let s = ''
  const buf = new Uint8Array(6)
  crypto.getRandomValues(buf)
  for (let i = 0; i < 6; i++) s += SLUG_CHARS[buf[i] % SLUG_CHARS.length]
  return s
}

async function getOrCreateShortLink(supabase: any, baseUrl: string, targetUrl: string, bookingId: string | null): Promise<string> {
  if (bookingId) {
    const { data: existing } = await supabase
      .from('short_links').select('slug').eq('booking_id', bookingId).maybeSingle()
    if (existing?.slug) return `${baseUrl}/s/${existing.slug}`
  }
  for (let i = 0; i < 6; i++) {
    const slug = genSlug()
    const { error } = await supabase.from('short_links').insert({ slug, target_url: targetUrl, booking_id: bookingId })
    if (!error) return `${baseUrl}/s/${slug}`
    // unique violation -> retry
  }
  throw new Error('could_not_generate_slug')
}

async function sendSms(toPhone: string, body: string): Promise<{ id: string } | null> {
  const user = Deno.env.get('ELKS46_USERNAME')
  const pass = Deno.env.get('ELKS46_PASSWORD')
  if (!user || !pass) return null
  const auth = btoa(`${user}:${pass}`)
  const res = await fetch('https://api.46elks.com/a1/sms', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      from: ((Deno.env.get('ELKS46_FROM') || 'GoGlamping').replace(/[^A-Za-z0-9]/g, '').slice(0, 11)) || 'GoGlamping',
      to: toPhone,
      message: body,
    }),
  })
  if (!res.ok) throw new Error(`46elks ${res.status}: ${await res.text()}`)
  const json = await res.json()
  return { id: json.id ?? '' }
}

function buildBody(name: string | null, link: string, lang: 'sv' | 'en'): string {
  const hi = name && name.trim()
    ? (lang === 'sv' ? `Hej ${name.trim()}!` : `Hi ${name.trim()}!`)
    : (lang === 'sv' ? 'Hej!' : 'Hi!')
  const leaf = USE_EMOJI ? ' 🌿' : ''
  const tent = USE_EMOJI ? '🏕️ ' : ''

  if (lang === 'sv') {
    return [
      `${hi}${leaf}`,
      '',
      'Om fem dagar vantar en mysig vistelse vid kanalen, med baddat talt och skon ro vid vattnet.'.replace(/vantar/, 'väntar').replace(/baddat talt/, 'bäddat tält').replace(/skon/, 'skön'),
      '',
      'Gor den extra fin med frukost fran bageriet, en fikapase i taltet eller tidig incheckning. Tillvalen bokar du senast tva dagar fore ankomst.'
        .replace(/Gor/, 'Gör').replace(/fran/, 'från').replace(/fikapase/, 'fikapåse').replace(/taltet/, 'tältet').replace(/tva/, 'två').replace(/fore/, 'före'),
      '',
      `Se dina tillval har: ${link}`.replace(/har:/, 'här:'),
      '',
      'Snart ses vi!',
      '',
      `${tent}/Bergs Slussar Glamping`,
    ].join('\n')
  }
  return [
    `${hi}${leaf}`,
    '',
    'In five days a cozy stay by the canal awaits, with a made bed and peaceful moments by the water.',
    '',
    'Make it extra lovely with breakfast from the bakery, a fika bag in the tent or early check-in. Add-ons must be booked at least 2 days before arrival.',
    '',
    `See your add-ons here: ${link}`,
    '',
    'See you soon!',
    '',
    `${tent}/Bergs Slussar Glamping`,
  ].join('\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: settings } = await supabase
    .from('app_settings').select('key, value')
    .in('key', ['prearrival_lead_days', 'public_base_url'])
  const settingsMap: Record<string, any> = {}
  for (const r of (settings ?? [])) settingsMap[r.key] = r.value
  const leadDays = Number(settingsMap['prearrival_lead_days'] ?? 5)
  const baseUrl = String(settingsMap['public_base_url'] ?? 'https://goglampingsweden.se').replace(/\/$/, '')

  const fmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' })
  const target = new Date(Date.now() + leadDays * 86400000)
  const targetDate = fmt.format(target)

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, public_token, guest_first_name, guest_name, tent_name, tent_id, checkin_date, checkout_date, nights, email, phone, language, reminder_5d_sent_at')
    .eq('checkin_date', targetDate)
    .is('reminder_5d_sent_at', null)

  const results: any[] = []
  for (const b of (bookings ?? [])) {
    const lang: 'sv' | 'en' = (b.language ?? b.tent_name ?? 'sv')
      ? ((b.language ?? 'sv').toLowerCase().startsWith('en') ? 'en' : 'sv') : 'sv'
    const firstName = b.guest_first_name || (b.guest_name ? b.guest_name.split(',').pop()!.trim().split(' ')[0] : null)
    const toPhone = normalizePhone(b.phone)

    if (!toPhone) {
      await supabase.from('prearrival_messages').upsert({
        booking_id: b.id, channel: 'sms', status: 'skipped', error: 'missing_phone',
      }, { onConflict: 'booking_id,channel' })
      results.push({ booking_id: b.id, sms: 'skipped_no_phone' })
      continue
    }

    try {
      const targetUrl = `${baseUrl}/stay/${b.public_token}`
      const link = await getOrCreateShortLink(supabase, baseUrl, targetUrl, b.id)
      const body = buildBody(firstName, link, lang)
      const r = await sendSms(toPhone, body)

      await supabase.from('bookings').update({ reminder_5d_sent_at: new Date().toISOString() }).eq('id', b.id)
      await supabase.from('prearrival_messages').upsert({
        booking_id: b.id, channel: 'sms', status: r ? 'sent' : 'skipped', error: r ? null : 'no_provider',
      }, { onConflict: 'booking_id,channel' })
      results.push({ booking_id: b.id, sms: r ? 'sent' : 'no_provider' })
    } catch (err) {
      await supabase.from('prearrival_messages').upsert({
        booking_id: b.id, channel: 'sms', status: 'failed', error: String(err),
      }, { onConflict: 'booking_id,channel' })
      results.push({ booking_id: b.id, sms: 'failed', error: String(err) })
    }
  }

  return new Response(JSON.stringify({ target_date: targetDate, lead_days: leadDays, count: bookings?.length ?? 0, results }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
