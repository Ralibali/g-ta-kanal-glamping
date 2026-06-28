import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const user = Deno.env.get('ELKS46_USERNAME')
  const pass = Deno.env.get('ELKS46_PASSWORD')
  if (!user || !pass) {
    return new Response(JSON.stringify({ error: 'Missing 46elks credentials' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: { to?: string; name?: string; tent?: string; lang?: string } = {}
  try { body = await req.json() } catch { /* ignore */ }
  const to = body.to
  const name = body.name ?? null
  const tent = body.tent ?? 'erat tält'
  const lang = (body.lang ?? 'sv').toLowerCase()
  if (!to) {
    return new Response(JSON.stringify({ error: 'to required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const sv = `${name ? `Hej ${name}` : 'Hej'} och välkommen till oss på Bergs Slussar Glamping! Våra städare har markerat ${tent} som klart, så ni är välkomna att checka in från nu. Incheckning sker via QR-koden vid entrén, där kan ni checka in med namn eller bokningsnummer och får sedan koden till tältet. Soliga hälsningar, Bergs Slussar Glamping`
  const en = `${name ? `Hi ${name}` : 'Hi'} and welcome to Bergs Slussar Glamping! Our cleaners have marked ${tent} as ready, so you are welcome to check in from now. Check in via the QR code at the entrance, where you can use your name or booking number, and you will then get the code to your tent. Kind regards, Bergs Slussar Glamping`
  const message = lang.startsWith('sv') ? sv : en

  const fromRaw = Deno.env.get('ELKS46_FROM') || 'Glamping'
  const from = fromRaw.replace(/[^A-Za-z0-9]/g, '').slice(0, 11) || 'Glamping'
  const auth = btoa(`${user}:${pass}`)
  const res = await fetch('https://api.46elks.com/a1/sms', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ from, to, message }),
  })
  const text = await res.text()
  return new Response(JSON.stringify({ ok: res.ok, status: res.status, body: text }), {
    status: res.ok ? 200 : 502,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
