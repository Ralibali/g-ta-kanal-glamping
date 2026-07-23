import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: file, error: dlErr } = await sb.storage.from('payslips').download('melvin/lonespec-juli-2026.pdf');
    if (dlErr || !file) throw new Error(dlErr?.message ?? 'download failed');
    const buf = new Uint8Array(await file.arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    const b64 = btoa(bin);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) throw new Error('missing keys');

    const res = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'Go Glamping Sweden <lonespec@goglampingsweden.se>',
        to: ['melvin@r8a.se'],
        bcc: ['info@auroramedia.se'],
        reply_to: 'info@auroramedia.se',
        subject: 'Lönespecifikation juli 2026 – Go Glamping Sweden',
        html: `<p>Hej Melvin!</p>
<p>Bifogat hittar du din lönespecifikation för juli 2026.</p>
<p><strong>Att betala ut: 983,62 kr</strong><br/>Utbetalning: <strong>24 juli 2026</strong> via Swish 0722254993.</p>
<p>Semesterersättning (118,03 kr) sparas separat och betalas ut senare.</p>
<p>Hör av dig om något ser fel ut. Tack för fint jobb i juli!</p>
<p>Mvh,<br/>Christoffer<br/>Aurora Media AB / Go Glamping Sweden</p>`,
        attachments: [{ filename: 'lonespec-melvin-juli-2026.pdf', content: b64 }],
      }),
    });
    const text = await res.text();
    return new Response(JSON.stringify({ status: res.status, body: text }), {
      status: res.ok ? 200 : res.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
