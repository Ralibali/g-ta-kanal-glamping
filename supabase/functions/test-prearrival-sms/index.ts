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

  const to = '+46722254993'
  const fromRaw = Deno.env.get('ELKS46_FROM') || 'Glamping'
  const from = (fromRaw.replace(/[^A-Za-z0-9]/g, '').slice(0, 11)) || 'Glamping'
  const link = 'https://goglampingsweden.se/stay/5e1f43ba-f57a-4f94-9943-95dcef3acc2b'
  const message = `Hej Christoffer! 🌿\n\nOm fem dagar är det dags – fredag 27 juni checkar ni in på Sjöbrisretreatet, och er vistelse hos oss varar till söndag 29 juni.\n\nIncheckning sker själv från kl 15:00. Tältet är olåst och redo, ni hittar er välkomstinfo på plats. Utcheckning senast kl 11:00.\n\nGör vistelsen ännu mysigare – beställ nybakad frukost vid kanalen eller en välkomstfikapåse som väntar i tältet. Boka enkelt här:\n${link}\n\nSnart ses vi! 🏕️☀️\n\n/Bergs Slussar Glamping`

  const auth = btoa(`${user}:${pass}`)
  const res = await fetch('https://api.46elks.com/a1/sms', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ from, to, message }),
  })
  const text = await res.text()
  return new Response(JSON.stringify({ ok: res.ok, status: res.status, body: text, from }), {
    status: res.ok ? 200 : 502,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
