## Utgångsläge

StayBoost är en **flertenants-plattform** byggd på TanStack Start (annan tech-stack än det här projektet, som är React + Vite). Databasen är helt separat med tabellerna `properties`, `bookings`, `addons`, `rooms`, `templates`, `sources`, `messages` m.m. Vi kan inte "koppla in" StayBoost — vi måste **portera** de delar vi behöver till detta projekts stack och databas.

Bra nyhet: schema och edge functions är rimligt fristående och kan översättas rakt av. Din glamping blir "property 1" i det nya schemat.

## Vad som portas över

**Databas (nya tabeller vid sidan av Sirvoy-bookings):**
- `properties` — din anläggning som en rad (förberett för fler i framtiden)
- `rooms` — de tre tälten, priser, kapacitet, sängkonfig
- `booking_engine_bookings` — direktbokningar från nya motorn (separat från `bookings` som fortsätter få Sirvoy-import)
- `booking_addons` — kopplingar till befintliga `addons`
- `sources` — Sirvoy-iCal-feed som en source så tillgänglighet kan blockeras
- `booking_engine_settings` — cutoff-regler, min/max nätter, prisregler

**Edge functions (portade från StayBoost):**
- `booking-engine` — sök tillgänglighet, skapa bokning, kollar konflikter mot både Sirvoy-import och egna bokningar
- `stripe-webhook` (utökar befintlig) — hanterar både addon-orders och nya bokningar
- `ical-sync` — hämtar Sirvoys iCal-feed så dubbelbokning undviks
- `ical-export` — publicerar din nya-motor-tillgänglighet till Sirvoy

**Frontend:**
- Ny route `/boka-direkt` (behåller Sirvoy-widgeten på `/` och `/boka` under övergången)
- Datumväljare, tältval, gästinfo, tillval, Stripe checkout eller Swish
- Admin: `AdminBookingEngine.tsx` — se direktbokningar, bekräfta Swish, hantera priser/regler
- Toggle i admin: "Visa direktboknings-widget istället för Sirvoy" när du är redo att byta helt

**Stripe:**
- Behåller din befintliga `STRIPE_SECRET_KEY` (BYOK)
- Återanvänder redan aktiverad `stripe-webhook`-funktion — utökas med `booking.created`-flöde
- Ny prislista i Stripe skapas inte; vi använder `price_data` inline eftersom priserna sätts i din databas

## Parallelldrift under 2026-säsongen

- Sirvoy fortsätter äga alla befintliga bokningar (fram till du väljer att stänga)
- CSV-import fortsätter fungera exakt som idag
- Nya direktbokningar hamnar i `booking_engine_bookings` och syns i admin bredvid Sirvoy-listan
- Städ-, incheckning- och stay-flödena läser från **båda** tabellerna via en vy `all_bookings_v` så gästen märker ingen skillnad
- iCal-sync håller kalendrarna synk så samma tält inte dubbelbokas

## Ordning

1. **Migration** — nya tabeller, GRANTs, RLS, seed av `properties`/`rooms` från din config, `all_bookings_v`-vy
2. **Edge functions** — porta `booking-engine`, `ical-sync`, `ical-export` (behåller StayBoosts logik)
3. **Admin** — `AdminBookingEngine.tsx` + Sirvoy iCal-konfiguration
4. **Publik `/boka-direkt`** — bokningsflöde med Stripe/Swish
5. **Stay-integration** — läs bokningar från `all_bookings_v` så alla befintliga flöden funkar för direktbokningar också
6. **Toggle** — låt dig aktivera direktmotor som primär widget när du är trygg

## Tekniska detaljer

- **Framework-översättning:** StayBoosts TanStack routes → React Router pages här. Logik i `src/lib/` och `supabase/functions/_shared/` kan kopieras nästan orört.
- **Multi-tenant → single-tenant:** vi behåller `property_id`-kolumnen men hårdkodar din property som default så vi kan expandera senare utan ny migration.
- **Sirvoy iCal:** din Sirvoy-panel har "Kalenderfeeder" per rum — vi läser den. Kräver att du kopierar in tre iCal-URL:er i admin (en per tält) första gången.
- **Ingen data raderas eller ändras** i befintliga tabeller. `booking_engine_bookings` är helt ny.

## Vad jag INTE gör i det här steget

- Portera StayBoosts meddelandemallar / drip-kampanjer (du har redan detta i Lovable Emails)
- Portera StayBoosts multi-property-admin (du är ensam property)
- Automatisk data-sync från Sirvoy → nya schemat (fortsätt CSV-importera som idag)
- Faktisk avstängning av Sirvoy (görs manuellt när du är nöjd)

## Ungefärlig omfattning

Cirka 6 migrations, 4 edge functions, 3 admin-komponenter, 1 publik bokningssida. Detta är **flera timmars implementation** och kommer att göras i steg — du får testa varje del innan vi går vidare.

Vill du att jag börjar med steg 1 (databas + vy) direkt?
