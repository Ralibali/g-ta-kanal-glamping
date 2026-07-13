import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { template as prearrivalOffer } from '../_shared/transactional-email-templates/prearrival-offer.tsx'

// Admin-only preview of the 5-day pre-arrival mailout (email + SMS).
// POST { booking_id?: string } -> { email, sms, booking }
// If booking_id is omitted, returns a synthetic preview using template previewData.

type Lang = 'sv' | 'en' | 'de' | 'da' | 'no' | 'nl' | 'fr'

function pickLang(raw: string | null | undefined): Lang {
  const l = (raw ?? '').toLowerCase().slice(0, 2)
  if (['sv','en','de','da','no','nl','fr'].includes(l)) return l as Lang
  return 'sv'
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

const ADDON_LABELS: Record<string, Record<string, string>> = {
  breakfast:     { sv: 'frukost', en: 'breakfast', de: 'Frühstück', da: 'morgenmad', no: 'frokost', nl: 'ontbijt', fr: 'petit-déjeuner' },
  early_checkin: { sv: 'tidig incheckning', en: 'early check-in', de: 'früher Check-in', da: 'tidlig check-in', no: 'tidlig innsjekk', nl: 'vroeg inchecken', fr: 'arrivée anticipée' },
  late_checkout: { sv: 'sen utcheckning', en: 'late check-out', de: 'später Check-out', da: 'sen check-out', no: 'sen utsjekk', nl: 'laat uitchecken', fr: 'départ tardif' },
}

function joinList(items: string[], lang: Lang): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  const and: Record<Lang, string> = { sv: ' eller ', en: ' or ', de: ' oder ', da: ' eller ', no: ' eller ', nl: ' of ', fr: ' ou ' }
  return items.slice(0, -1).join(', ') + and[lang] + items[items.length - 1]
}

function buildSmsBody(name: string | null, link: string | null, lang: Lang, availableSlugs: string[]): string {
  const greetings: Record<Lang, (n: string) => string> = {
    sv: (n) => `Hej ${n}!`, en: (n) => `Hi ${n}!`, de: (n) => `Hallo ${n}!`,
    da: (n) => `Hej ${n}!`, no: (n) => `Hei ${n}!`, nl: (n) => `Hoi ${n}!`, fr: (n) => `Bonjour ${n} !`,
  }
  const noName: Record<Lang, string> = { sv: 'Hej!', en: 'Hi!', de: 'Hallo!', da: 'Hej!', no: 'Hei!', nl: 'Hoi!', fr: 'Bonjour !' }
  const hi = name && name.trim() ? greetings[lang](name.trim()) : noName[lang]

  const arrivalLine: Record<Lang, string> = {
    sv: 'Om fem dagar väntar en mysig vistelse vid kanalen, med bäddat tält och skön ro vid vattnet.',
    en: 'In five days a cosy stay by the canal awaits, with a freshly made-up tent and peaceful calm by the water.',
    de: 'In funf Tagen erwartet Sie ein gemutlicher Aufenthalt am Kanal, mit gemachtem Bett und Ruhe am Wasser.',
    da: 'Om fem dage venter et hyggeligt ophold ved kanalen med redt telt og ro ved vandet.',
    no: 'Om fem dager venter et koselig opphold ved kanalen, med oppredd telt og ro ved vannet.',
    nl: 'Over vijf dagen wacht een gezellig verblijf aan het kanaal, met opgemaakt bed en rust aan het water.',
    fr: "Dans cinq jours, un sejour cosy vous attend au bord du canal, avec un lit fait et le calme pres de l'eau.",
  }
  const seeYou: Record<Lang, string> = {
    sv: 'Snart ses vi!', en: 'See you soon!', de: 'Bis bald!',
    da: 'Vi ses snart!', no: 'Vi ses snart!', nl: 'Tot snel!', fr: 'A bientot !',
  }
  const parts: string[] = [`${hi} ${arrivalLine[lang]}`]

  if (availableSlugs.length > 0 && link) {
    const labels = availableSlugs.map((s) => ADDON_LABELS[s]?.[lang] ?? ADDON_LABELS[s]?.en).filter(Boolean) as string[]
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
  parts.push(`${seeYou[lang]} /Bergs Slussar Glamping`)
  return parts.join(' ')
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
  const token = authHeader.replace('Bearer ', '')
  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
  const { data: claims, error: claimsErr } = await callerClient.auth.getClaims(token)
  if (claimsErr || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const admin = createClient(supabaseUrl, serviceKey)
  const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', claims.claims.sub)
  if (!(roles ?? []).some((r: { role: string }) => r.role === 'admin')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  let body: { booking_id?: string } = {}
  try { body = await req.json() } catch { /* ok */ }

  // Settings
  const { data: settings } = await admin
    .from('app_settings').select('key, value')
    .in('key', ['prearrival_lead_days', 'order_cutoff_days', 'public_base_url'])
  const settingsMap: Record<string, any> = {}
  for (const r of (settings ?? [])) settingsMap[r.key] = r.value
  const leadDays = Number(settingsMap['prearrival_lead_days'] ?? 5)
  const cutoffDays = Number(settingsMap['order_cutoff_days'] ?? 2)
  const baseUrl = String(settingsMap['public_base_url'] ?? 'https://goglampingsweden.se').replace(/\/$/, '')

  // Prices for the email template — read from active addons
  const { data: addonRows } = await admin.from('addons').select('slug, price_sek, active').eq('active', true)
  const priceBySlug = new Map<string, number>()
  for (const a of (addonRows ?? [])) priceBySlug.set(a.slug, Number(a.price_sek))
  const breakfastPrice = priceBySlug.get('breakfast') ?? 209
  const fikaPrice = priceBySlug.get('fika_bag') ?? 89
  const earlyPrice = priceBySlug.get('early_checkin') ?? 399
  const latePrice = priceBySlug.get('late_checkout') ?? 399

  let bookingRow: any = null
  if (body.booking_id) {
    const { data } = await admin
      .from('bookings')
      .select('id, public_token, guest_first_name, guest_name, tent_name, tent_id, checkin_date, checkout_date, nights, email, phone, language, reminder_5d_sent_at, booking_number')
      .eq('id', body.booking_id).maybeSingle()
    bookingRow = data
  }

  // Compute available add-on slugs (those the guest hasn't ordered yet)
  const allSlugs = (addonRows ?? []).map((a: any) => a.slug)
  let availableSlugs = allSlugs.filter((s: string) => ADDON_LABELS[s])
  if (bookingRow) {
    const { data: orders } = await admin
      .from('addon_orders').select('addon_id, status')
      .eq('booking_id', bookingRow.id).in('status', ['requested', 'confirmed', 'paid'])
    const orderedIds = new Set((orders ?? []).map((o: any) => o.addon_id))
    const orderedSlugs = new Set<string>()
    for (const a of (addonRows ?? [])) if (orderedIds.has(a.id)) orderedSlugs.add(a.slug)
    availableSlugs = availableSlugs.filter((s: string) => !orderedSlugs.has(s))
  }

  const lang = pickLang(bookingRow?.language)
  const firstName = bookingRow?.guest_first_name
    || (bookingRow?.guest_name ? String(bookingRow.guest_name).split(',').pop()!.trim().split(' ')[0] : 'Anna')
  const tentName = bookingRow?.tent_name || 'Naturkärnan'
  const nights = bookingRow?.nights ?? 2
  const link = bookingRow?.public_token
    ? `${baseUrl}/stay/${bookingRow.public_token}`
    : `${baseUrl}/stay/PREVIEW`

  // Render email
  const emailProps = {
    firstName, tentName,
    checkinDate: bookingRow?.checkin_date,
    checkoutDate: bookingRow?.checkout_date,
    nights,
    daysWord: 'fem',
    breakfastPrice, fikaPrice, earlyPrice, latePrice,
    link, lang,
  }
  let emailHtml = ''
  let emailSubject = ''
  let emailErr: string | null = null
  try {
    emailHtml = await renderAsync(React.createElement(prearrivalOffer.component, emailProps))
    emailSubject = typeof prearrivalOffer.subject === 'function'
      ? prearrivalOffer.subject(emailProps)
      : prearrivalOffer.subject
  } catch (e) {
    emailErr = e instanceof Error ? e.message : String(e)
  }

  // Build SMS
  const smsBody = buildSmsBody(firstName, link, lang, availableSlugs)
  const toPhone = normalizePhone(bookingRow?.phone)

  return new Response(JSON.stringify({
    booking: bookingRow ? {
      id: bookingRow.id,
      booking_number: bookingRow.booking_number,
      guest_first_name: firstName,
      tent_name: tentName,
      checkin_date: bookingRow.checkin_date,
      checkout_date: bookingRow.checkout_date,
      nights: bookingRow.nights,
      email: bookingRow.email,
      phone: bookingRow.phone,
      language: lang,
      reminder_5d_sent_at: bookingRow.reminder_5d_sent_at,
    } : null,
    settings: { leadDays, cutoffDays, baseUrl, breakfastPrice, fikaPrice, earlyPrice, latePrice },
    available_addons: availableSlugs,
    email: { subject: emailSubject, html: emailHtml, recipient: bookingRow?.email ?? null, error: emailErr },
    sms: {
      body: smsBody,
      to: toPhone,
      raw_phone: bookingRow?.phone ?? null,
      lang,
      length: smsBody.length,
      segments: Math.max(1, Math.ceil(smsBody.length / 160)),
      skipped_reason: !bookingRow ? 'preview_only' : (!toPhone ? 'missing_phone' : null),
    },
  }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
