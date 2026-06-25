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
  breakfast:     { sv: 'frukost från bageriet', en: 'breakfast from the bakery', de: 'Frühstück von der Bäckerei', da: 'morgenmad fra bageriet', no: 'frokost fra bakeriet', nl: 'ontbijt van de bakkerij', fr: 'petit-déjeuner de la boulangerie' },
  fika_bag:      { sv: 'en fikapåse i tältet',  en: 'a fika bag in the tent',    de: 'eine Fika-Tüte im Zelt',      da: 'en fika-pose i teltet',  no: 'en fika-pose i teltet',  nl: 'een fika-tas in de tent',     fr: 'un sac fika dans la tente' },
  early_checkin: { sv: 'tidig incheckning',     en: 'early check-in',            de: 'früher Check-in',             da: 'tidlig check-in',        no: 'tidlig innsjekk',        nl: 'vroeg inchecken',             fr: 'arrivée anticipée' },
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
  const leaf = USE_EMOJI ? ' 🌿' : ''
  const tent = USE_EMOJI ? '🏕️ ' : ''
  const signature = `${tent}/Bergs Slussar Glamping`

  const arrivalLine: Record<Lang, string> = {
    sv: 'Om fem dagar väntar en mysig vistelse vid kanalen, med bäddat tält och skön ro vid vattnet.',
    en: 'In five days a cozy stay by the canal awaits, with a made bed and peaceful moments by the water.',
    de: 'In fünf Tagen erwartet Sie ein gemütlicher Aufenthalt am Kanal, mit gemachtem Bett und Ruhe am Wasser.',
    da: 'Om fem dage venter et hyggeligt ophold ved kanalen med redt telt og ro ved vandet.',
    no: 'Om fem dager venter et koselig opphold ved kanalen, med oppredd telt og ro ved vannet.',
    nl: 'Over vijf dagen wacht een gezellig verblijf aan het kanaal, met opgemaakt bed en rust aan het water.',
    fr: 'Dans cinq jours, un séjour cosy vous attend au bord du canal, avec un lit fait et le calme près de l\'eau.',
  }
  const seeYou: Record<Lang, string> = {
    sv: 'Snart ses vi!', en: 'See you soon!', de: 'Bis bald!',
    da: 'Vi ses snart!', no: 'Vi ses snart!', nl: 'Tot snel!', fr: 'À bientôt !',
  }
  const slipperTip: Record<Lang, string> = {
    sv: 'Tips: ta gärna med tofflor – fräscht i den allmänna duschen i servicehuset som delas med kanalens övriga gäster.',
    en: 'Tip: bring slippers – fresh in the shared shower at the service house used by all canal guests.',
    de: 'Tipp: Hausschuhe mitbringen – angenehm in der Gemeinschaftsdusche des Servicehauses, die alle Kanalgäste nutzen.',
    da: 'Tip: tag tøfler med – friskt i det fælles bad i servicehuset, som deles med kanalens andre gæster.',
    no: 'Tips: ta med tøfler – fint i det felles dusjen i servicehuset som deles med kanalens andre gjester.',
    nl: 'Tip: neem slippers mee – fris in de gemeenschappelijke douche van het servicehuis, gedeeld met alle kanaalgasten.',
    fr: 'Astuce : pensez aux chaussons – agréable dans la douche commune de la maison de service, partagée avec les autres hôtes du canal.',
  }

  const lines: string[] = [`${hi}${leaf}`, '', arrivalLine[lang], '']


  if (availableSlugs.length > 0 && link) {
    const labels = availableSlugs
      .map((s) => ADDON_LABELS[s]?.[lang] ?? ADDON_LABELS[s]?.en)
      .filter(Boolean) as string[]
    const list = joinList(labels, lang)
    const offer: Record<Lang, string> = {
      sv: `Gör den extra fin med ${list}. Tillvalen bokar du senast 2 dagar före ankomst.`,
      en: `Make it extra lovely with ${list}. Add-ons must be booked at least 2 days before arrival.`,
      de: `Machen Sie ihn besonders schön mit ${list}. Extras sind spätestens 2 Tage vor Anreise zu buchen.`,
      da: `Gør det ekstra dejligt med ${list}. Tilvalg skal bestilles senest 2 dage før ankomst.`,
      no: `Gjør det ekstra fint med ${list}. Tillegg må bestilles senest 2 dager før ankomst.`,
      nl: `Maak het extra leuk met ${list}. Extra's moet u uiterlijk 2 dagen voor aankomst boeken.`,
      fr: `Rendez-le encore plus agréable avec ${list}. Les options doivent être réservées au moins 2 jours avant l'arrivée.`,
    }
    const linkLine: Record<Lang, string> = {
      sv: `Se dina tillval här: ${link}`,
      en: `See your add-ons here: ${link}`,
      de: `Ihre Extras hier: ${link}`,
      da: `Se dine tilvalg her: ${link}`,
      no: `Se dine tillegg her: ${link}`,
      nl: `Bekijk je extra's hier: ${link}`,
      fr: `Voir vos options ici : ${link}`,
    }
    lines.push(offer[lang], '', linkLine[lang], '')
  }

  lines.push(slipperTip[lang], '', seeYou[lang], '', signature)
  return lines.join('\n')
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
