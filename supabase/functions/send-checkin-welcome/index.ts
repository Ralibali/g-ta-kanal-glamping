import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

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

async function getOrCreateShortLink(supabase: any, baseUrl: string, targetUrl: string, bookingId: string | null, suffix: string): Promise<string> {
  // Try to find an existing short link for this booking with same target
  if (bookingId) {
    const { data: existing } = await supabase
      .from('short_links').select('slug, target_url').eq('booking_id', bookingId)
    const match = (existing ?? []).find((r: any) => r.target_url === targetUrl)
    if (match?.slug) return `${baseUrl}/s/${match.slug}`
  }
  for (let i = 0; i < 6; i++) {
    const slug = genSlug()
    const { error } = await supabase.from('short_links').insert({ slug, target_url: targetUrl, booking_id: bookingId })
    if (!error) return `${baseUrl}/s/${slug}`
  }
  throw new Error('could_not_generate_slug')
}

async function sendSms(toPhone: string, body: string) {
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
  return await res.json()
}

type Lang = 'sv' | 'en' | 'de' | 'da' | 'no' | 'nl' | 'fr'
function pickLang(raw: string | null | undefined): Lang {
  const l = (raw ?? '').toLowerCase().slice(0, 2)
  if (['sv','en','de','da','no','nl','fr'].includes(l)) return l as Lang
  return 'sv'
}

function buildBody(name: string | null, link: string, lang: Lang): string {
  const greetings: Record<Lang, (n: string) => string> = {
    sv: (n) => `Hej ${n}!`, en: (n) => `Hi ${n}!`, de: (n) => `Hallo ${n}!`,
    da: (n) => `Hej ${n}!`, no: (n) => `Hei ${n}!`, nl: (n) => `Hoi ${n}!`, fr: (n) => `Bonjour ${n} !`,
  }
  const noName: Record<Lang, string> = { sv: 'Hej!', en: 'Hi!', de: 'Hallo!', da: 'Hej!', no: 'Hei!', nl: 'Hoi!', fr: 'Bonjour !' }
  const hi = name && name.trim() ? greetings[lang](name.trim()) : noName[lang]

  const welcome: Record<Lang, string> = {
    sv: 'Varmt välkomna till Bergs Slussar Glamping! Vi hoppas att ni får en härlig vistelse och tack för att ni besöker oss!',
    en: 'Warm welcome to Bergs Slussar Glamping! We hope you have a lovely stay and thank you for visiting us!',
    de: 'Herzlich willkommen bei Bergs Slussar Glamping! Wir wünschen Ihnen einen schönen Aufenthalt und danken für Ihren Besuch!',
    da: 'Hjertelig velkommen til Bergs Slussar Glamping! Vi håber, I får et dejligt ophold, og tak fordi I besøger os!',
    no: 'Hjertelig velkommen til Bergs Slussar Glamping! Vi håper dere får et fint opphold, og takk for at dere besøker oss!',
    nl: 'Hartelijk welkom bij Bergs Slussar Glamping! We hopen dat jullie een fijn verblijf hebben en bedankt voor jullie bezoek!',
    fr: 'Bienvenue chaleureuse à Bergs Slussar Glamping ! Nous vous souhaitons un excellent séjour et vous remercions de votre visite !',
  }
  const info: Record<Lang, string> = {
    sv: `Här hittar ni allt ni behöver under vistelsen - tips och bra att veta: ${link}`,
    en: `Here you'll find everything you need during your stay - tips and good to know: ${link}`,
    de: `Hier finden Sie alles für Ihren Aufenthalt - Tipps und Wissenswertes: ${link}`,
    da: `Her finder I alt, hvad I har brug for under opholdet - tips og godt at vide: ${link}`,
    no: `Her finner dere alt dere trenger under oppholdet - tips og godt å vite: ${link}`,
    nl: `Hier vind je alles wat je nodig hebt tijdens je verblijf - tips en goed om te weten: ${link}`,
    fr: `Vous trouverez ici tout ce qu'il vous faut pendant votre séjour - conseils et infos utiles : ${link}`,
  }
  const signature: Record<Lang, string> = {
    sv: 'Soliga hälsningar,\nBergs Slussar Glamping',
    en: '/Bergs Slussar Glamping',
    de: '/Bergs Slussar Glamping',
    da: '/Bergs Slussar Glamping',
    no: '/Bergs Slussar Glamping',
    nl: '/Bergs Slussar Glamping',
    fr: '/Bergs Slussar Glamping',
  }

  return [hi, '', welcome[lang], '', info[lang], '', signature[lang]].join('\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  let body: any = {}
  try { body = await req.json() } catch { /* ignore */ }
  const bookingNumber: string | undefined = body?.booking_number
  if (!bookingNumber) {
    return new Response(JSON.stringify({ error: 'missing_booking_number' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: settings } = await supabase
    .from('app_settings').select('key, value').in('key', ['public_base_url'])
  const settingsMap: Record<string, any> = {}
  for (const r of (settings ?? [])) settingsMap[r.key] = r.value
  const baseUrl = String(settingsMap['public_base_url'] ?? 'https://goglampingsweden.se').replace(/\/$/, '')

  const { data: b } = await supabase
    .from('bookings')
    .select('id, public_token, guest_first_name, guest_name, phone, language')
    .eq('booking_number', bookingNumber)
    .maybeSingle()

  if (!b) {
    return new Response(JSON.stringify({ status: 'booking_not_found' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const toPhone = normalizePhone(b.phone)
  if (!toPhone) {
    return new Response(JSON.stringify({ status: 'skipped_no_phone' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const lang = pickLang(b.language)
  const firstName = b.guest_first_name || (b.guest_name ? b.guest_name.split(',').pop()!.trim().split(' ')[0] : null)
  const targetUrl = `${baseUrl}/under-vistelsen?t=${b.public_token}`

  try {
    const link = await getOrCreateShortLink(supabase, baseUrl, targetUrl, b.id, 'uv')
    const msg = buildBody(firstName, link, lang)
    const result = await sendSms(toPhone, msg)
    return new Response(JSON.stringify({ status: result ? 'sent' : 'no_provider', link }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ status: 'failed', error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
