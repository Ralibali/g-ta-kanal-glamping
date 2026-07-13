import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const USE_EMOJI = false

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

// Per-language addon labels keyed by slug
const ADDON_LABELS: Record<string, Record<string, string>> = {
  breakfast:     { sv: 'frukost', en: 'breakfast', de: 'Frühstück', da: 'morgenmad', no: 'frokost', nl: 'ontbijt', fr: 'petit-déjeuner' },
  early_checkin: { sv: 'tidig incheckning', en: 'early check-in', de: 'früher Check-in', da: 'tidlig check-in', no: 'tidlig innsjekk', nl: 'vroeg inchecken', fr: 'arrivée anticipée' },
  late_checkout: { sv: 'sen utcheckning', en: 'late check-out', de: 'später Check-out', da: 'sen check-out', no: 'sen utsjekk', nl: 'laat uitchecken', fr: 'départ tardif' },
}

function joinList(items: string[], lang: string): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  const and: Record<string, string> = { sv: ' eller ', en: ' or ', de: ' oder ', da: ' eller ', no: ' eller ', nl: ' of ', fr: ' ou ' }
  return items.slice(0, -1).join(', ') + (and[lang] ?? and.en) + items[items.length - 1]
}

type Lang = 'sv' | 'en' | 'de' | 'da' | 'no' | 'nl' | 'fr'
function pickLang(raw: string | null | undefined): Lang {
  const l = (raw ?? '').toLowerCase().slice(0, 2)
  if (['sv','en','de','da','no','nl','fr'].includes(l)) return l as Lang
  return 'sv'
}

function buildBody(name: string | null, link: string | null, lang: Lang, availableSlugs: string[]): string {
  const greetings: Record<Lang, (n: string) => string> = {
    sv: (n) => `Hej ${n}!`, en: (n) => `Hi ${n}!`, de: (n) => `Hallo ${n}!`,
    da: (n) => `Hej ${n}!`, no: (n) => `Hei ${n}!`, nl: (n) => `Hoi ${n}!`, fr: (n) => `Bonjour ${n} !`,
  }
  const noName: Record<Lang, string> = { sv: 'Hej!', en: 'Hi!', de: 'Hallo!', da: 'Hej!', no: 'Hei!', nl: 'Hoi!', fr: 'Bonjour !' }
  const hi = name && name.trim() ? greetings[lang](name.trim()) : noName[lang]

  const arrivalLine: Record<Lang, string> = {
    sv: 'Om fem dagar vantar en mysig vistelse vid kanalen, med baddat talt och skon ro vid vattnet.',
    en: 'In five days a cosy stay by the canal awaits, with a freshly made-up tent and peaceful calm by the water.',
    de: 'In funf Tagen erwartet Sie ein gemutlicher Aufenthalt am Kanal, mit gemachtem Bett und Ruhe am Wasser.',
    da: 'Om fem dage venter et hyggeligt ophold ved kanalen med redt telt og ro ved vandet.',
    no: 'Om fem dager venter et koselig opphold ved kanalen, med oppredd telt og ro ved vannet.',
    nl: 'Over vijf dagen wacht een gezellig verblijf aan het kanaal, met opgemaakt bed en rust aan het water.',
    fr: "Dans cinq jours, un sejour cosy vous attend au bord du canal, avec un lit fait et le calme pres de l'eau.",
  }
  // restore Swedish accents (they are GSM-7 safe)
  arrivalLine.sv = 'Om fem dagar väntar en mysig vistelse vid kanalen, med bäddat tält och skön ro vid vattnet.'

  const seeYou: Record<Lang, string> = {
    sv: 'Snart ses vi!', en: 'See you soon!', de: 'Bis bald!',
    da: 'Vi ses snart!', no: 'Vi ses snart!', nl: 'Tot snel!', fr: 'A bientot !',
  }
  const signature = '/Bergs Slussar Glamping'

  const parts: string[] = [`${hi} ${arrivalLine[lang]}`]

  if (availableSlugs.length > 0 && link) {
    const labels = availableSlugs
      .map((s) => ADDON_LABELS[s]?.[lang] ?? ADDON_LABELS[s]?.en)
      .filter(Boolean) as string[]
    const list = joinList(labels, lang)
    const offer: Record<Lang, string> = {
      sv: `Gör den extra fin med ${list}. Tillvalen bokar du senast 2 dagar före ankomst.`,
      en: `Make it extra special with ${list}. Add-ons can be booked up to 2 days before arrival.`,
      de: `Machen Sie ihn besonders schon mit ${list}. Extras sind spatestens 2 Tage vor Anreise zu buchen.`,
      da: `Gor det ekstra dejligt med ${list}. Tilvalg skal bestilles senest 2 dage for ankomst.`,
      no: `Gjor det ekstra fint med ${list}. Tillegg ma bestilles senest 2 dager for ankomst.`,
      nl: `Maak het extra leuk met ${list}. Extra's moet u uiterlijk 2 dagen voor aankomst boeken.`,
      fr: `Rendez-le encore plus agreable avec ${list}. Les options doivent etre reservees au moins 2 jours avant l'arrivee.`,
    }
    const linkLine: Record<Lang, string> = {
      sv: `Se dina tillval här och annan viktig information: ${link}`,
      en: `See your add-ons and other useful info here: ${link}`,
      de: `Ihre Extras und weitere Infos hier: ${link}`,
      da: `Se dine tilvalg og anden nyttig info her: ${link}`,
      no: `Se dine tillegg og annen nyttig info her: ${link}`,
      nl: `Bekijk je extra's en andere info hier: ${link}`,
      fr: `Voir vos options et autres infos utiles ici : ${link}`,
    }
    parts.push(offer[lang], linkLine[lang])
  } else if (link) {
    const linkOnly: Record<Lang, string> = {
      sv: `Här hittar du viktig information inför vistelsen: ${link}`,
      en: `Useful info for your stay: ${link}`,
      de: `Wichtige Infos fur Ihren Aufenthalt: ${link}`,
      da: `Nyttig info til dit ophold: ${link}`,
      no: `Nyttig info til oppholdet: ${link}`,
      nl: `Nuttige info voor je verblijf: ${link}`,
      fr: `Infos utiles pour votre sejour : ${link}`,
    }
    parts.push(linkOnly[lang])
  }

  parts.push(`${seeYou[lang]} ${signature}`)
  return parts.join(' ')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: settings } = await supabase
    .from('app_settings').select('key, value')
    .in('key', ['prearrival_lead_days', 'order_cutoff_days', 'public_base_url'])
  const settingsMap: Record<string, any> = {}
  for (const r of (settings ?? [])) settingsMap[r.key] = r.value
  const leadDays = Number(settingsMap['prearrival_lead_days'] ?? 5)
  const cutoffDays = Number(settingsMap['order_cutoff_days'] ?? 2)
  const baseUrl = String(settingsMap['public_base_url'] ?? 'https://goglampingsweden.se').replace(/\/$/, '')

  // Window: all upcoming bookings whose check-in falls within [today+cutoff, today+leadDays]
  // and that have not yet received the 5-day reminder.
  const fmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' })
  const fromDate = fmt.format(new Date(Date.now() + cutoffDays * 86400000))
  const toDate = fmt.format(new Date(Date.now() + leadDays * 86400000))

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, public_token, guest_first_name, guest_name, tent_name, tent_id, checkin_date, checkout_date, nights, email, phone, language, reminder_5d_sent_at')
    .gte('checkin_date', fromDate)
    .lte('checkin_date', toDate)
    .is('reminder_5d_sent_at', null)

  // Preload active addon slugs
  const { data: allAddons } = await supabase.from('addons').select('id, slug').eq('active', true)
  const slugById = new Map<string, string>()
  const allSlugs: string[] = []
  for (const a of (allAddons ?? [])) {
    slugById.set(a.id, a.slug)
    allSlugs.push(a.slug)
  }

  const results: any[] = []
  for (const b of (bookings ?? [])) {
    const lang = pickLang(b.language)
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
      // Fetch existing addon orders (active)
      const { data: orders } = await supabase
        .from('addon_orders').select('addon_id, status')
        .eq('booking_id', b.id)
        .in('status', ['requested', 'confirmed', 'paid'])
      const orderedSlugs = new Set<string>()
      for (const o of (orders ?? [])) {
        const s = slugById.get(o.addon_id)
        if (s) orderedSlugs.add(s)
      }
      const availableSlugs = allSlugs.filter((s) => !orderedSlugs.has(s))

      const targetUrl = `${baseUrl}/stay/${b.public_token}`
      const link = availableSlugs.length > 0
        ? await getOrCreateShortLink(supabase, baseUrl, targetUrl, b.id)
        : null
      const body = buildBody(firstName, link, lang, availableSlugs)
      const r = await sendSms(toPhone, body)

      await supabase.from('bookings').update({ reminder_5d_sent_at: new Date().toISOString() }).eq('id', b.id)
      await supabase.from('prearrival_messages').upsert({
        booking_id: b.id, channel: 'sms', status: r ? 'sent' : 'skipped', error: r ? null : 'no_provider',
      }, { onConflict: 'booking_id,channel' })
      results.push({ booking_id: b.id, sms: r ? 'sent' : 'no_provider', available: availableSlugs })
    } catch (err) {
      await supabase.from('prearrival_messages').upsert({
        booking_id: b.id, channel: 'sms', status: 'failed', error: String(err),
      }, { onConflict: 'booking_id,channel' })
      results.push({ booking_id: b.id, sms: 'failed', error: String(err) })
    }
  }

  return new Response(JSON.stringify({ from: fromDate, to: toDate, lead_days: leadDays, cutoff_days: cutoffDays, count: bookings?.length ?? 0, results }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
