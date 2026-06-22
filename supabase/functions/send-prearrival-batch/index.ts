import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const NUMBER_WORDS = {
  sv: ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv'],
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'],
} as const

function daysWord(n: number, lang: 'sv' | 'en'): string {
  return NUMBER_WORDS[lang][n] ?? String(n)
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  // Read settings
  const { data: settings } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['prearrival_lead_days', 'public_base_url'])
  const settingsMap: Record<string, any> = {}
  for (const r of (settings ?? [])) settingsMap[r.key] = r.value
  const leadDays = Number(settingsMap['prearrival_lead_days'] ?? 5)
  const baseUrl = String(settingsMap['public_base_url'] ?? 'https://goglampingsweden.se').replace(/\/$/, '')

  // Target date in Stockholm
  const fmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' })
  const now = new Date()
  const target = new Date(now.getTime() + leadDays * 24 * 60 * 60 * 1000)
  const targetDate = fmt.format(target) // YYYY-MM-DD

  // Read addon prices
  const { data: addonRows } = await supabase
    .from('addons')
    .select('slug, price_sek')
    .eq('active', true)
  const prices: Record<string, number> = {}
  for (const a of (addonRows ?? [])) prices[a.slug] = a.price_sek

  // Find bookings checking in on target date
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, public_token, guest_first_name, guest_name, tent_name, tent_id, checkin_date, checkout_date, nights, email, phone, language')
    .eq('checkin_date', targetDate)

  const TENT_NAMES: Record<string, string> = {
    sjobris: 'Sjöbrisretreatet',
    naturkarnan: 'Naturkärnan',
    lugnetsyta: 'Lugnets Yta',
  }

  const results: any[] = []
  for (const b of (bookings ?? [])) {
    const lang: 'sv' | 'en' = (b.language ?? 'en').toLowerCase().startsWith('sv') ? 'sv' : 'en'
    const firstName = b.guest_first_name || (b.guest_name ? b.guest_name.split(',')[0].split(' ').pop() : null)
    const tentName = TENT_NAMES[b.tent_id] || b.tent_name || b.tent_id
    const link = `${baseUrl}/stay/${b.public_token}`
    const dWord = daysWord(leadDays, lang)
    const breakfastPrice = prices['breakfast'] ?? 209
    const fikaPrice = prices['fika_bag'] ?? 89

    // Email
    const { data: existsEmail } = await supabase.from('prearrival_messages')
      .select('id').eq('booking_id', b.id).eq('channel', 'email').maybeSingle()
    if (!existsEmail) {
      if (b.email) {
        try {
          const r = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              templateName: 'prearrival-offer',
              recipientEmail: b.email,
              idempotencyKey: `prearrival-${b.id}`,
              templateData: {
                firstName, tentName, lang,
                checkinDate: b.checkin_date, checkoutDate: b.checkout_date, nights: b.nights,
                daysWord: dWord,
                breakfastPrice: prices['breakfast'] ?? 209,
                fikaPrice: prices['fika_bag'] ?? 89,
                earlyPrice: prices['early_checkin'] ?? 399,
                link,
              },
            }),
          })
          await supabase.from('prearrival_messages').insert({
            booking_id: b.id, channel: 'email', status: r.ok ? 'sent' : 'failed', error: r.ok ? null : `${r.status}`,
          })
          results.push({ booking_id: b.id, email: r.ok ? 'sent' : `failed_${r.status}` })
        } catch (err) {
          await supabase.from('prearrival_messages').insert({
            booking_id: b.id, channel: 'email', status: 'failed', error: String(err),
          })
        }
      } else {
        await supabase.from('prearrival_messages').insert({
          booking_id: b.id, channel: 'email', status: 'skipped', error: 'missing_email',
        })
      }
    }

    // SMS
    const { data: existsSms } = await supabase.from('prearrival_messages')
      .select('id').eq('booking_id', b.id).eq('channel', 'sms').maybeSingle()
    if (!existsSms) {
      const toPhone = normalizePhone(b.phone)
      if (toPhone) {
        const body = lang === 'sv'
          ? `Hej ${firstName ?? ''}! Om ${dWord} dagar väntar ${tentName} på er 🌿 Gör vistelsen extra mysig – nybakad frukost vid sjön (${breakfastPrice} kr), välkomstfikapåse i tältet (${fikaPrice} kr) eller sen utcheckning. Boka enkelt: ${link}\n\nVi ses snart!\nBergs Slussar Glamping`
          : `Hi ${firstName ?? ''}! In ${dWord} days ${tentName} is ready for you 🌿 Make your stay extra cosy – fresh breakfast by the lake (${breakfastPrice} SEK), a welcome fika bag in the tent (${fikaPrice} SEK) or late check-out. Book here: ${link}\n\nSee you soon!\nBergs Slussar Glamping`
        try {
          const r = await sendSms(toPhone, body)
          await supabase.from('prearrival_messages').insert({
            booking_id: b.id, channel: 'sms', status: r ? 'sent' : 'skipped', error: r ? null : 'no_provider',
          })
          results.push({ booking_id: b.id, sms: r ? 'sent' : 'no_provider' })
        } catch (err) {
          await supabase.from('prearrival_messages').insert({
            booking_id: b.id, channel: 'sms', status: 'failed', error: String(err),
          })
        }
      } else {
        await supabase.from('prearrival_messages').insert({
          booking_id: b.id, channel: 'sms', status: 'skipped', error: 'missing_phone',
        })
      }
    }
  }

  return new Response(JSON.stringify({ target_date: targetDate, lead_days: leadDays, count: bookings?.length ?? 0, results }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
