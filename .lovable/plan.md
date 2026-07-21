## Översikt

Bygger ovanpå befintligt system. Återanvänder `bookings` (email/phone-kolumner finns redan), `46elks` (ELKS46_*-secrets finns), Lovable Emails (Brevo via Resend-connector finns), Stripe (måste aktiveras), och städmodulen i `src/pages/Cleaning.tsx`.

## Steg 1 — Databas (migration)

Lägg till på `bookings`:
- `language text` (kopiera från `lang` om null)
- `country_code text`
- `public_token uuid default gen_random_uuid()` + unikt index
- `guest_first_name text` (härled från `guest_name` vid import)
- `tent_name text`
- `nights integer`
- `sirvoy_booking_no text unique` (samma som `booking_number` om saknas)
- `needs_contact_info boolean generated` (true om email eller phone saknas)

Nya tabeller:
- `addons` — katalog (sv/en namn+beskrivning, pris, unit, max_quantity, sort_order, active)
- `addon_orders` — booking_id, addon_id, quantity, unit_price_sek, total_sek, status, stripe_session_id, stripe_payment_intent, paid_at
- `prearrival_messages` — booking_id + channel unik (idempotens)
- `early_checkin_flags` — tent_id + date unik (driver städ-sortering)
- `app_settings` — key/value för PREARRIVAL_LEAD_DAYS, ORDER_CUTOFF_DAYS, OWNER_EMAIL

GRANTs + RLS:
- `addons`: public SELECT (active=true), admin all
- `addon_orders`: ingen anon, admin all, service_role för webhooks
- `prearrival_messages`, `early_checkin_flags`, `app_settings`: admin all + service_role
- RPC `get_stay_by_token(uuid)` (SECURITY DEFINER) — returnerar booking + addons + orders, **utan email/phone/adress** (skyddar PII)
- RPC `list_bookings_missing_contact(int)` (admin) — för admin-flagga
- RPC `set_early_checkin_flag(tent_id, date, bool)` (service_role)

Seed: 3 addons (frukost 209, fikapåse 89, tidig incheckning 399).

## Steg 2 — CSV-import i admin

I `BookingsManager.tsx`, lägg till "Importera Sirvoy CSV"-knapp:
- Parsar CSV (Sirvoy-fält: Booking no, First name, Last name, email, phone, country, Specification, Room ID, Check-in, Check-out, Units)
- Upsert på `sirvoy_booking_no` (eller `booking_number`)
- Sätter `language` från country_code (SE→sv, annars en)
- Visar diff: nya / uppdaterade / saknar kontakt
- All parsing klientsida → batch insert via supabase-client

## Steg 3 — Edge functions

**`send-prearrival-batch`** (cron, dagligen 09:00 Stockholm)
- Hämtar bookings där checkin_date = today + lead_days (från app_settings, default 5)
- För varje utan rad i prearrival_messages: rendera mail (via send-transactional-email) + SMS (46elks direkt)
- Mall-nyckel: `prearrival-offer` (ny tsx-mall i transactional-email-templates/)
- Hoppar och loggar om email/phone saknas
- pg_cron schemaläggs via `supabase--insert`

**`create-addon-checkout`** (public, ingen JWT)
- Body: `{ public_token, items: [{addon_id, quantity}] }`
- Validerar: token finns, checkin_date - today >= cutoff_days, addons aktiva
- Skapar Stripe Checkout (mode=payment, payment_method_types=['card'], **Swish aktiveras separat i Stripe Dashboard**)
- Skapar `addon_orders`-rader status=pending
- Returnerar checkout URL

**`stripe-addon-webhook`** (public, signaturverifiering)
- `checkout.session.completed` → uppdatera orders till `paid` (frukost/fika) eller `confirmed` (tidig incheckning)
- Om tidig incheckning: anropa `set_early_checkin_flag`
- Skickar gästbekräftelse (mail + SMS) + ägarnotis (mail till app_settings.OWNER_EMAIL)
- Idempotent via stripe_session_id

## Steg 4 — Mallar (React Email, sv/en i samma fil)

- `prearrival-offer.tsx` — meny + länk
- `addon-confirmation-guest.tsx` — tack-mail till gäst
- `addon-notification-owner.tsx` — ägarnotis

Skriv ut antal dagar i bokstäver (`fem`/`five`-helper).

## Steg 5 — Frontend

**Ny route `/stay/:token`** (`src/pages/Stay.tsx`)
- Anropar `get_stay_by_token` RPC
- Visar vistelse + addon-meny på rätt språk
- Frukost/fika: antalsväljare 1–max
- Tidig incheckning: toggle
- Visar redan köpta tillval
- Cutoff-check: om <2 dygn → "Tyvärr för sent"-meddelande
- "Lägg till & betala" → anropar `create-addon-checkout` → redirect
- `/stay/:token/tack` — tack-sida
- Mobile-first, samma färg/typsnitt (#2c5f2e, Playfair/DM Sans)

**Admin tillägg:**
- `AddonsManager.tsx` — CRUD på addons + edit app_settings (lead_days, owner_email)
- `BookingsManager.tsx`: 
  - CSV-import-knapp + diff-modal
  - Sektion "Saknar kontaktuppgifter" (röda rader för bokningar inom utskicksfönstret)
- `AddonOrdersManager.tsx` — filtrerbar lista
- Sidebar-länkar

**Städsida (`src/pages/Cleaning.tsx`):**
- Läs `early_checkin_flags` för datumet
- Sortera tält så flaggade hamnar överst
- Orange ram + badge "⏰ Tidig incheckning kl 12.00 – städa detta tält först" / EN

## Steg 6 — Stripe-aktivering

Använder **Lovable's built-in Stripe payments** (`enable_stripe_payments`). Användaren får ett formulär att fylla i. Efter aktivering konfigureras webhooks automatiskt. Swish aktiveras manuellt i Stripe Dashboard.

## Tekniska detaljer

- Tidszon: SQL använder `(now() AT TIME ZONE 'Europe/Stockholm')::date` för datum-jämförelser
- PUBLIC_BASE_URL: hämtas från app_settings (default `https://goglampingsweden.se`)
- Telefon-normalisering vid CSV-import: lägger till `+46` om svenskt nummer börjar med 0
- Säkerhet: `get_stay_by_token` returnerar INTE email/phone/address i svaret
- `prearrival_messages` har `(booking_id, channel)` unique constraint
- Webhook idempotens: kollar `paid_at IS NULL` innan uppdatering

## Vad jag INTE bygger nu

- Sirvoy API-sync (du valde CSV-import)
- Marknadsföringsmail / drip campaigns
- Återbetalningsflöde via UI (görs i Stripe Dashboard; flaggan tas bort manuellt eller via cron som kollar webhook `charge.refunded`)

## Reihenfolge

1. Migration (databas + RPC)
2. Edge functions + mallar + Stripe
3. CSV-import + admin-sidor
4. /stay/:token-flöde
5. Städ-prioritering
6. Cron-schema (pg_cron via supabase--insert)
