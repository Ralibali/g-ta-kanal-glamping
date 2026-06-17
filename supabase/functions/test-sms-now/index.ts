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

  const to = '+46722254993' // hardcoded test recipient for safety
  const fromRaw = Deno.env.get('ELKS46_FROM') || 'Glamping'
  const from = fromRaw.replace(/[^A-Za-z0-9]/g, '').slice(0, 11) || 'Glamping'
  const message =
    'Hej Christoffer och välkommen till oss på Bergs Slussar Glamping! ☀️\n\n' +
    'Våra städare har markerat erat tält som klart, vilket gör att ni är välkomna från nu. Ni checkar in via QR-koden som finns vid entrén och därigenom så får ni koden till erat tält. Bokningskoden hittar du i din mail.\n\n' +
    'Har ni beställt frukost då serveras det mellan 08:30-09:00 och finns vid portalen halvvägs upp i backen. Om ni har beställt fikapåse så finns det redo i erat tält!\n\n' +
    'Har ni några frågor? Hör av er till Christoffer per SMS på 0722254993.\n\n' +
    'Vänligen\n\nBergs slussar Glamping 🏕️'

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
