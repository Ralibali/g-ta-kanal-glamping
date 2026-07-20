// Booking engine: synkar bokningar från iCal-källor (Airbnb, Booking.com m.fl.).
// Auth: x-cron-secret (alla källor) ELLER admin-JWT.
// Beteende:
//  - Kontaktuppgifter som fyllts i skrivs ALDRIG över av synken.
//  - Framtida event som försvunnit ur flödet ⇒ status "cancelled".
//  - Block ("Not available"/"Closed") är inte bokningar och hoppas över.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { guestNameFrom, isBlockEvent, parseIcs } from "../_shared/be-ics.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Auth
  const cronSecret = req.headers.get("x-cron-secret");
  const expected = Deno.env.get("CRON_SECRET");
  let authorized = Boolean(expected && cronSecret === expected);
  if (!authorized) {
    const authHeader = req.headers.get("Authorization") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (serviceKey && authHeader === `Bearer ${serviceKey}`) authorized = true;
  }
  if (!authorized) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error } = await userClient.auth.getUser();
    if (error || !userData?.user) return json({ error: "unauthorized" }, 401);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "forbidden" }, 403);
    authorized = true;
  }

  let bodySourceId: string | null = null;
  try {
    if (req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      if (b && typeof b.source_id === "string") bodySourceId = b.source_id;
    }
  } catch { /* no body */ }

  let srcQuery = admin
    .from("be_ical_sources")
    .select("id, property_id, unit_id, name, url");
  if (bodySourceId) srcQuery = srcQuery.eq("id", bodySourceId);
  else srcQuery = srcQuery.eq("active", true);
  const { data: sources, error: srcErr } = await srcQuery;
  if (srcErr) return json({ error: srcErr.message }, 500);

  const today = new Date().toISOString().slice(0, 10);
  const results: Array<Record<string, unknown>> = [];

  for (const src of sources ?? []) {
    let created = 0, updated = 0, cancelled = 0, eventsCount = 0;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const resp = await fetch(src.url, { signal: controller.signal, redirect: "follow" });
      clearTimeout(timer);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const events = parseIcs(await resp.text()).filter(
        (e) => !isBlockEvent(e) && e.status !== "CANCELLED",
      );
      eventsCount = events.length;

      const { data: existing } = await admin
        .from("be_bookings")
        .select("id, ical_uid, guest_name, checkin_date, checkout_date, status")
        .eq("ical_source_id", src.id);
      const byUid = new Map((existing ?? []).map((b) => [b.ical_uid, b]));
      const feedUids = new Set(events.map((e) => e.uid));

      for (const ev of events) {
        const prev = byUid.get(ev.uid);
        if (!prev) {
          const { error } = await admin.from("be_bookings").insert({
            property_id: src.property_id,
            unit_id: src.unit_id,
            source: "ical",
            ical_source_id: src.id,
            ical_uid: ev.uid,
            guest_name: guestNameFrom(ev.summary),
            checkin_date: ev.startDate,
            checkout_date: ev.endDate,
            status: "confirmed",
          });
          if (!error) created++;
        } else if (
          prev.checkin_date !== ev.startDate ||
          prev.checkout_date !== ev.endDate ||
          prev.status !== "confirmed"
        ) {
          const patch: Record<string, unknown> = {
            checkin_date: ev.startDate,
            checkout_date: ev.endDate,
            status: "confirmed",
          };
          if (!prev.guest_name && guestNameFrom(ev.summary))
            patch.guest_name = guestNameFrom(ev.summary);
          const { error } = await admin.from("be_bookings").update(patch).eq("id", prev.id);
          if (!error) updated++;
        }
      }

      for (const b of existing ?? []) {
        if (
          b.ical_uid && !feedUids.has(b.ical_uid) &&
          b.status === "confirmed" && b.checkin_date >= today
        ) {
          const { error } = await admin
            .from("be_bookings").update({ status: "cancelled" }).eq("id", b.id);
          if (!error) cancelled++;
        }
      }

      await admin.from("be_ical_sources").update({
        last_synced_at: new Date().toISOString(),
        last_status: `ok (${eventsCount} event, +${created} nya, ${updated} uppdaterade, ${cancelled} avbokade)`,
        last_error: null,
        events_count: eventsCount,
      }).eq("id", src.id);
      results.push({ source: src.name, ok: true, created, updated, cancelled });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await admin.from("be_ical_sources").update({
        last_synced_at: new Date().toISOString(),
        last_status: `fel: ${msg}`,
        last_error: msg,
      }).eq("id", src.id);
      results.push({ source: src.name, ok: false, error: msg });
    }
  }

  return json({ synced: results.length, results });
});
