import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const USE_EMOJI = false
const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function genSlug(): string {
  let s = ''
  const buf = new Uint8Array(6)
  crypto.getRandomValues(buf)
  for (let i = 0; i < 6; i++) s += SLUG_CHARS[buf[i] % SLUG_CHARS.length]
  return s
}

function buildBody(name: string, link: string): string {
  const hi = `Hej ${name}!`
  const leaf = USE_EMOJI ? ' 🌿' : ''
  const tent = USE_EMOJI ? '🏕️ ' : ''
  return [
    `${hi}${leaf}`,
    '',
    'Om fem dagar väntar en mysig vistelse vid kanalen, med bäddat tält och skön ro vid vattnet.',
    '',
    'Gör den extra fin med frukost från bageriet, en fikapåse i tältet eller tidig incheckning. Tillvalen bokar du senast 2 dagar före ankomst.',
    '',
    `Se dina tillval här: ${link}`,
    '',
    'Snart ses vi!',
    '',
    `${tent}/Bergs Slussar Glamping`,
  ].join('\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const user = Deno.env.get('ELKS46_USERNAME')
  const pass = Deno.env.get('ELKS46_PASSWORD')
  if (!user || !pass) {
    return new Response(JSON.stringify({ error: 'Missing 46elks credentials' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const baseUrl = 'https://goglampingsweden.se'
  // Real upcoming booking with no phone: Lars Olsson, Sjöbrisretreatet, 26–28 juni
  const targetUrl = `${baseUrl}/stay/9ac6a4cb-00d1-442a-aa62-8d09b0219704`

  // Always create a fresh short link for the test (no booking_id binding)
  let slug = ''
  for (let i = 0; i < 6; i++) {
    const candidate = genSlug()
    const { error } = await supabase.from('short_links').insert({ slug: candidate, target_url: targetUrl, booking_id: null })
    if (!error) { slug = candidate; break }
  }
  if (!slug) {
    return new Response(JSON.stringify({ error: 'could_not_create_short_link' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const link = `${baseUrl}/s/${slug}`

  const to = '+46722254993'
  const fromRaw = Deno.env.get('ELKS46_FROM') || 'Glamping'
  const from = (fromRaw.replace(/[^A-Za-z0-9]/g, '').slice(0, 11)) || 'Glamping'
  const message = buildBody('Christoffer', link)

  const auth = btoa(`${user}:${pass}`)
  const res = await fetch('https://api.46elks.com/a1/sms', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ from, to, message }),
  })
  const text = await res.text()
  return new Response(JSON.stringify({ ok: res.ok, status: res.status, body: text, from, short_link: link, target_url: targetUrl, message }), {
    status: res.ok ? 200 : 502,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
