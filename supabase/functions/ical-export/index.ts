// Booking engine: publikt iCal-flöde per enhet (GET ?token=<unit.ical_feed_token>).
// Klistras in i Airbnb/Booking.com så kanalen blockerar datum bokade via andra
// vägar. Innehåller BARA blockerade datum — inga gästnamn eller kontaktuppgifter.
// Slår ihop be_bookings (direkta/iCal) + legacy Sirvoy-bokningar (public.bookings).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { buildIcs } from "../_shared/be-ics.ts";

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!/^[0-9a-f]{24}$/.test(token)) {
    return new Response("invalid_token", { status: 400 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: unit } = await admin
    .from("be_units")
    .select("id, name, legacy_tent_id, be_properties(name)")
    .eq("ical_feed_token", token)
    .maybeSingle();
  if (!unit) return new Response("not_found", { status: 404 });

  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const until = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);

  const [{ data: beRows }, { data: legacyRows }] = await Promise.all([
    admin.from("be_bookings")
      .select("id, checkin_date, checkout_date")
      .eq("unit_id", unit.id).neq("status", "cancelled")
      .gte("checkout_date", since).lte("checkin_date", until)
      .order("checkin_date"),
    unit.legacy_tent_id
      ? admin.from("bookings")
          .select("id, checkin_date, checkout_date")
          .eq("tent_id", unit.legacy_tent_id)
          .gte("checkout_date", since).lte("checkin_date", until)
          .order("checkin_date")
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const events = [
    ...(beRows ?? []).map((b) => ({
      uid: `be-${b.id}@goglampingsweden`,
      startDate: b.checkin_date, endDate: b.checkout_date, summary: "Bokad",
    })),
    ...(legacyRows ?? []).map((b) => ({
      uid: `sirvoy-${b.id}@goglampingsweden`,
      startDate: b.checkin_date, endDate: b.checkout_date, summary: "Bokad",
    })),
  ];

  const propertyName = (unit as any).be_properties?.name ?? "Go Glamping Sweden";
  const ics = buildIcs(events, `${propertyName} — ${unit.name}`);
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${unit.name.replace(/[^a-z0-9]+/gi, "_")}.ics"`,
      "Cache-Control": "no-cache",
    },
  });
});
