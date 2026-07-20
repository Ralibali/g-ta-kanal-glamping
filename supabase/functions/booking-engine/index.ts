// Publik bokningsmotor för Go Glamping Sweden.
//  GET  ?slug=<property-slug>  → enheter, priser och upptagna datum
//  POST {slug, unitId, ...}    → skapar direktbokning (Swish eller Stripe)
//
// Integritet: GET lämnar ALDRIG ut gästuppgifter — bara blockerade datum.
// Överlappsskyddet räknar in BÅDE be_bookings och legacy Sirvoy-bokningar
// (public.bookings) via unitens legacy_tent_id-koppling.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import {
  nightsBetween,
  quoteStay,
  rangesOverlap,
} from "../_shared/be-pricing.ts";
import { priceAddons, sumAddons, type Addon } from "../_shared/be-addons.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

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

  const url = new URL(req.url);

  // ---------------- GET: ledighet + priser ----------------
  if (req.method === "GET") {
    const slug = url.searchParams.get("slug") ?? "";
    const { data: property } = await admin
      .from("be_properties")
      .select("id, name, slug, checkin_time, checkout_time, swish_number, currency")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    if (!property) return json({ error: "not_found" }, 404);

    const { data: units } = await admin
      .from("be_units")
      .select(
        "id, name, description, capacity, base_price, weekend_pct, min_stay, cleaning_fee, monthly_mult, sort_order, legacy_tent_id",
      )
      .eq("property_id", property.id)
      .eq("active", true)
      .order("sort_order");

    const today = new Date().toISOString().slice(0, 10);
    const until = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);

    // 1) Direktbokningar
    const { data: beBookings } = await admin
      .from("be_bookings")
      .select("unit_id, checkin_date, checkout_date")
      .eq("property_id", property.id)
      .neq("status", "cancelled")
      .gte("checkout_date", today)
      .lte("checkin_date", until);

    // 2) Legacy Sirvoy-bokningar per tent_id → unit.id
    const { data: legacyBookings } = await admin
      .from("bookings")
      .select("tent_id, checkin_date, checkout_date")
      .gte("checkout_date", today)
      .lte("checkin_date", until);

    const legacyByTent = new Map<string, { from: string; to: string }[]>();
    for (const b of legacyBookings ?? []) {
      if (!b.tent_id) continue;
      const arr = legacyByTent.get(b.tent_id) ?? [];
      arr.push({ from: b.checkin_date, to: b.checkout_date });
      legacyByTent.set(b.tent_id, arr);
    }

    const byUnit = new Map<string, { from: string; to: string }[]>();
    for (const b of beBookings ?? []) {
      if (!b.unit_id) continue;
      const arr = byUnit.get(b.unit_id) ?? [];
      arr.push({ from: b.checkin_date, to: b.checkout_date });
      byUnit.set(b.unit_id, arr);
    }

    const { data: addons } = await admin
      .from("be_addons")
      .select(
        "id, name, name_en, description, description_en, price, price_type, image_url, max_quantity, sort_order",
      )
      .eq("property_id", property.id)
      .eq("active", true)
      .order("sort_order");

    return json({
      property: {
        name: property.name,
        slug: property.slug,
        checkinTime: property.checkin_time,
        checkoutTime: property.checkout_time,
        currency: property.currency,
        swishNumber: property.swish_number,
        stripeAvailable: Boolean(Deno.env.get("STRIPE_SECRET_KEY")),
      },
      units: (units ?? []).map((u) => {
        const legacy = u.legacy_tent_id ? (legacyByTent.get(u.legacy_tent_id) ?? []) : [];
        const own = byUnit.get(u.id) ?? [];
        return {
          id: u.id,
          name: u.name,
          description: u.description,
          capacity: u.capacity,
          basePrice: u.base_price,
          weekendPct: u.weekend_pct,
          minStay: u.min_stay,
          cleaningFee: u.cleaning_fee,
          monthlyMult: (u.monthly_mult ?? []).map(Number),
          booked: [...own, ...legacy],
        };
      }),
      addons: addons ?? [],
    });
  }

  // ---------------- POST: skapa direktbokning ----------------
  if (req.method === "POST") {
    let body: any;
    try { body = await req.json(); } catch { return json({ error: "invalid_body" }, 400); }
    const { slug, unitId, checkin, checkout } = body ?? {};
    const guestName = String(body?.guest_name ?? "").trim();
    const guestEmail = String(body?.guest_email ?? "").trim();
    const guestPhone = String(body?.guest_phone ?? "").trim();
    const language = ["sv", "en", "de"].includes(body?.language) ? body.language : "sv";

    if (!ISO_DATE.test(checkin ?? "") || !ISO_DATE.test(checkout ?? "") || checkout <= checkin) {
      return json({ error: "invalid_dates" }, 400);
    }
    const today = new Date().toISOString().slice(0, 10);
    if (checkin < today) return json({ error: "past_checkin" }, 400);
    if (nightsBetween(checkin, checkout).length > 30) return json({ error: "too_long" }, 400);
    if (!guestEmail && !guestPhone) return json({ error: "contact_required" }, 400);

    const { data: property } = await admin
      .from("be_properties")
      .select("id, swish_number, name")
      .eq("slug", slug).eq("active", true).maybeSingle();
    if (!property) return json({ error: "not_found" }, 404);

    const { data: unit } = await admin
      .from("be_units")
      .select("id, name, property_id, base_price, weekend_pct, min_stay, cleaning_fee, monthly_mult, capacity, legacy_tent_id")
      .eq("id", unitId).eq("property_id", property.id).eq("active", true).maybeSingle();
    if (!unit) return json({ error: "unit_not_found" }, 404);

    if (nightsBetween(checkin, checkout).length < unit.min_stay) {
      return json({ error: "min_stay", minStay: unit.min_stay }, 400);
    }

    const guestsRaw = Number(body?.guests);
    const guests = Number.isInteger(guestsRaw) && guestsRaw > 0 ? guestsRaw : 2;
    if (guests > unit.capacity) return json({ error: "over_capacity", capacity: unit.capacity }, 400);

    // Överlappsskydd: både direkta bokningar och legacy Sirvoy
    const [{ data: beClash }, { data: legClash }] = await Promise.all([
      admin.from("be_bookings")
        .select("checkin_date, checkout_date")
        .eq("unit_id", unit.id).neq("status", "cancelled")
        .lt("checkin_date", checkout).gt("checkout_date", checkin),
      unit.legacy_tent_id
        ? admin.from("bookings")
            .select("checkin_date, checkout_date")
            .eq("tent_id", unit.legacy_tent_id)
            .lt("checkin_date", checkout).gt("checkout_date", checkin)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const conflicts = [...(beClash ?? []), ...(legClash ?? [])];
    if (conflicts.some((c) => rangesOverlap(checkin, checkout, c.checkin_date, c.checkout_date))) {
      return json({ error: "unavailable" }, 409);
    }

    const quote = quoteStay(
      { base_price: unit.base_price, weekend_pct: unit.weekend_pct,
        cleaning_fee: unit.cleaning_fee, monthly_mult: (unit.monthly_mult ?? []).map(Number) },
      checkin, checkout,
    );

    const rawSelections = Array.isArray(body?.addons) ? body.addons : [];
    const { data: availableAddons } = await admin
      .from("be_addons")
      .select("id, name, description, price, price_type, image_url, active, max_quantity, sort_order")
      .eq("property_id", property.id).eq("active", true);
    const pricedAddons = priceAddons(
      rawSelections, (availableAddons ?? []) as Addon[], quote.nights, guests,
    );
    const addonsTotal = sumAddons(pricedAddons);
    const grandTotal = quote.total + addonsTotal;

    // Betalning: gästen väljer, annars Stripe > Swish > ingen
    const requested = String(body?.paymentMethod ?? "");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const stripeOk = Boolean(stripeKey);
    const swishOk = Boolean(property.swish_number);
    let paymentMethod: "none" | "swish" | "stripe" = "none";
    if (requested === "stripe" && stripeOk) paymentMethod = "stripe";
    else if (requested === "swish" && swishOk) paymentMethod = "swish";
    else if (requested) return json({ error: "payment_method_unavailable" }, 400);
    else if (stripeOk) paymentMethod = "stripe";
    else if (swishOk) paymentMethod = "swish";

    const paymentRef = `GG-${crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
    const takesPayment = paymentMethod !== "none";
    const initialStatus = takesPayment ? "pending" : "confirmed";

    const { data: booking, error } = await admin
      .from("be_bookings")
      .insert({
        property_id: property.id,
        unit_id: unit.id,
        source: "direct",
        guest_name: guestName || null,
        guest_email: guestEmail || null,
        guest_phone: guestPhone || null,
        guests,
        checkin_date: checkin,
        checkout_date: checkout,
        status: initialStatus,
        payment_method: paymentMethod,
        payment_status: takesPayment ? "pending" : "none",
        payment_amount: grandTotal,
        payment_ref: paymentRef,
        addons_total: addonsTotal,
        total_amount: grandTotal,
        language,
      })
      .select("id, guest_token, public_token")
      .single();
    if (error) return json({ error: error.message }, 500);

    if (pricedAddons.length) {
      const { error: addonError } = await admin.from("be_booking_addons").insert(
        pricedAddons.map((p) => ({
          booking_id: booking.id,
          addon_id: p.addon.id,
          quantity: p.quantity,
          unit_price: p.addon.price,
          price_type: p.addon.price_type,
          line_total: p.lineTotal,
        })),
      );
      if (addonError) {
        await admin.from("be_bookings").delete().eq("id", booking.id);
        return json({ error: addonError.message }, 500);
      }
    }

    // Stripe Checkout
    if (paymentMethod === "stripe") {
      try {
        const appBase = Deno.env.get("PUBLIC_APP_URL") ?? req.headers.get("origin") ?? "https://goglampingsweden.se";
        const params = new URLSearchParams();
        params.set("mode", "payment");
        params.set("success_url", `${appBase}/boka-direkt/${slug}?paid=1&token=${booking.guest_token}`);
        params.set("cancel_url", `${appBase}/boka-direkt/${slug}?cancel=1`);
        params.set("client_reference_id", booking.id);
        params.set("payment_method_types[0]", "card");
        params.set("line_items[0][quantity]", "1");
        params.set("line_items[0][price_data][currency]", "sek");
        params.set("line_items[0][price_data][unit_amount]", String(Math.round(grandTotal * 100)));
        params.set("line_items[0][price_data][product_data][name]", `${unit.name} · ${checkin}–${checkout}`);
        params.set("metadata[payment_ref]", paymentRef);
        params.set("metadata[be_booking_id]", booking.id);
        if (guestEmail) params.set("customer_email", guestEmail);

        const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });
        const stripeData = await stripeRes.json();
        if (!stripeRes.ok || !stripeData?.url) throw new Error(stripeData?.error?.message ?? "stripe_error");
        await admin.from("be_bookings").update({ stripe_session_id: stripeData.id }).eq("id", booking.id);
        return json({
          ok: true,
          bookingId: booking.id,
          guestToken: booking.guest_token,
          publicToken: booking.public_token,
          price: quote,
          grandTotal,
          paymentMethod: "stripe",
          checkoutUrl: stripeData.url,
        });
      } catch (e) {
        await admin.from("be_bookings").delete().eq("id", booking.id);
        return json({ error: "stripe_failed", detail: String(e) }, 502);
      }
    }

    return json({
      ok: true,
      bookingId: booking.id,
      guestToken: booking.guest_token,
      publicToken: booking.public_token,
      price: quote,
      grandTotal,
      paymentMethod,
      ...(paymentMethod === "swish"
        ? { swishNumber: property.swish_number, paymentRef, paymentAmount: grandTotal }
        : {}),
    });
  }

  return json({ error: "method_not_allowed" }, 405);
});
