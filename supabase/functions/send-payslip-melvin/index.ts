// Resend Melvin's payslips (July 2026 and corrected August 2026).
// Sends the PDF download links via Resend to melvin@r8a.se (bcc info@auroramedia.se).
// Admin/service only — this is a payroll administration endpoint.
import { requireAdminOrService } from "../_shared/require-admin.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const RESEND_GATEWAY_URL = "https://connector-gateway.lovable.dev/resend/emails";
const FROM_ADDRESS = "hej@goglampingsweden.se";
const TO = ["melvin@r8a.se"];
const BCC = ["info@auroramedia.se"];

const payslips = [
  {
    key: "juli",
    subject: "Lönespec juli 2026 – Go Glamping Sweden",
    path: "melvin/lonespec-juli-2026.pdf",
    body: `Hej Melvin!<br /><br />Här kommer din lönespec för juli 2026 som PDF.<br /><br /><a href="{{LINK}}">Ladda ner lönespec juli 2026 (PDF)</a><br /><br />Länken gäller i 7 dagar.<br /><br />Hälsningar,<br />Aurora Media AB / Go Glamping Sweden`,
  },
  {
    key: "augusti",
    subject: "Korrigerad lönespec augusti 2026 – Go Glamping Sweden",
    path: "melvin/lonespec-augusti-2026.pdf",
    body: `Hej Melvin!<br /><br />Här kommer din korrigerade lönespec för augusti 2026 (med preliminär A-skatt 30&nbsp;% inräknad) som PDF.<br /><br />Sammanfattning:<br />• Bruttolön inkl. semesterersättning 12&nbsp;%: <b>3 825,01 kr</b><br />• Preliminär A-skatt 30&nbsp;%: <b>−1 147,50 kr</b><br />• Netto utbetalt: <b>2 677,51 kr</b> till konto 5319-0334064, utbetald 2026-08-25<br /><br /><a href="{{LINK}}">Ladda ner korrigerad lönespec augusti 2026 (PDF)</a><br /><br />Länken gäller i 7 dagar.<br /><br />Hälsningar,<br />Aurora Media AB / Go Glamping Sweden`,
  },
];

async function sendViaResend(payload: Record<string, unknown>, lovableApiKey: string, resendApiKey: string) {
  const res = await fetch(RESEND_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": resendApiKey,
    },
    body: JSON.stringify({
      from: `Bergs Slussar Glamping <${FROM_ADDRESS}>`,
      reply_to: "info@auroramedia.se",
      to: TO,
      bcc: BCC,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      headers: { "X-Entity-Ref-ID": crypto.randomUUID() },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body.slice(0, 500)}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const denied = await requireAdminOrService(req, corsHeaders);
  if (denied) return denied;

  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!lovableApiKey || !resendApiKey || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let which: string[] = ["juli", "augusti"];
  try {
    const body = await req.json();
    if (Array.isArray(body?.which) && body.which.length) which = body.which;
    else if (typeof body?.which === "string") which = [body.which];
  } catch {
    // no body → send both
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const results: Record<string, unknown>[] = [];

  for (const key of which) {
    const p = payslips.find((x) => x.key === key);
    if (!p) {
      results.push({ key, error: "unknown payslip key" });
      continue;
    }
    try {
      const { data, error } = await supabase.storage
        .from("payslips")
        .createSignedUrl(p.path, 60 * 60 * 24 * 7);
      if (error || !data?.signedUrl) throw new Error(`signed url failed: ${error?.message ?? "no url"}`);

      const html = p.body.replace("{{LINK}}", data.signedUrl);
      const text = p.body
        .replace(/<br\s*\/?>/g, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\u00a0/g, " ")
        .replace("{{LINK}}", data.signedUrl);

      const sent = await sendViaResend({ subject: p.subject, html, text }, lovableApiKey, resendApiKey);
      results.push({ key, ok: true, id: (sent as { id?: string }).id ?? null });
    } catch (e) {
      results.push({ key, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  const allOk = results.every((r) => r.ok === true);
  return new Response(JSON.stringify({ success: allOk, results }), {
    status: allOk ? 200 : 500,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
});
