# Native booking cutover — Sirvoy exit

## Objective

Replace Sirvoy as the direct booking/PMS dependency for Bergs Slussar Glamping with a native booking engine connected directly to the property's Stripe account.

Sirvoy remains a temporary safety net only until the native flow has passed the gates below. The goal is not a second permanent booking system.

## Target architecture

`goglampingsweden.se/boka`
→ native booking UI
→ Supabase Edge Function `booking-engine`
→ canonical `be_*` reservation ledger
→ 30-minute Stripe inventory hold
→ Stripe Checkout
→ signed `stripe-webhook`
→ paid booking
→ compatibility bridge into current operations
→ `/frukost`, `/stad`, check-in, guest page and messages

Channel availability is added to the same canonical ledger through connectors. Browser automation may be a fallback/verification layer but must never be the only double-booking protection.

## Current implementation branch

`feat/native-booking-engine`

Preview-only routes:

- `/boka-native`
- `/en/book-native`
- `/de/buchen-native`

The current `/boka` remains on Sirvoy until cutover.

## Booking engine guarantees

Before production cutover the system must prove:

- server-side price calculation
- server-side availability validation
- database-level race-safe overlap protection per tent
- pending Stripe checkout blocks inventory temporarily
- stale/expired checkout releases inventory
- Stripe webhook signature verification
- webhook idempotency
- successful payment marks booking paid
- cancelled/expired payment does not remain bookable as a real stay
- paid native booking appears in existing operational flows
- add-ons such as breakfast reach existing operations
- no secret is exposed to the browser

## Data mapping required before enabling

`be_properties`

- one active property with the production slug used by `VITE_NATIVE_BOOKING_PROPERTY_SLUG`
- correct contact data and currency

`be_units`

Every live tent needs:

- correct name
- capacity
- `legacy_tent_id` matching `sjobris`, `naturkarnan` or `lugnetsyta`
- current base price
- weekend adjustment
- monthly multipliers
- minimum stay
- cleaning fee

Do not assume these values. Reconcile them against current production/Sirvoy before cutover.

`be_addons`

Only sell configured, verified add-ons. Map reusable operational add-ons to the existing `addons` table through `legacy_addon_id` or matching `slug` so `/frukost` and other workflows receive them.

## Stripe setup

Secrets belong in the Supabase project secret store, never in GitHub or chat:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PUBLIC_BASE_URL=https://goglampingsweden.se`

The existing signed Stripe webhook is extended to route sessions with `metadata.kind = native_booking` to the accommodation booking path while preserving existing add-on checkout behavior.

Use Stripe test mode first. Do not paste keys into issues, PRs or agent prompts.

## Test matrix

### Availability

- book each tent individually
- overlapping dates are blocked
- back-to-back checkout/check-in is allowed
- two simultaneous attempts for the same tent/date produce at most one hold
- abandoned checkout becomes available again after expiry
- cancelled booking releases inventory

### Pricing

- weekday
- Friday/Saturday weekend adjustment
- month boundary
- one night
- multi-night
- minimum stay
- cleaning fee
- each enabled add-on type
- server result matches the UI display

### Payment

- successful Stripe test payment
- cancelled checkout
- expired checkout
- webhook repeated twice
- return page before webhook arrives
- webhook before return page

### Operations bridge

For a paid native booking verify:

- booking exists in operations
- correct tent
- correct dates
- correct guest count/contact
- `/frukost` sees paid breakfast
- `/stad` sees checkout/cleaning need
- check-in can resolve the booking
- guest page token resolves correctly
- transactional confirmation is sent once

### UX

- iPhone/mobile first
- desktop
- Swedish
- English
- German
- clear unavailable dates
- useful validation messages
- Stripe return state
- no dead end if payment fails

## Channel reconciliation before Sirvoy cancellation

Native direct booking is not enough to cancel Sirvoy if Sirvoy is still the source of truth for Booking.com or other channels.

Before cancellation, prove that all external channel reservations block the same `be_units` inventory through a reliable connector path and that every future booking currently in Sirvoy has been imported/reconciled.

Required:

- Booking.com future reservations reconciled
- any other active OTA/channel reconciled
- no orphaned future Sirvoy bookings
- iCal/API health visible
- stale sync creates an alert/fail-safe, not silent availability
- export/import direction documented

## Final Sirvoy cancellation gate

Do not cancel Sirvoy until all are true:

1. `/boka-native` passes full preview QA.
2. Test-mode Stripe passes.
3. At least one controlled live Stripe booking passes end-to-end.
4. Paid booking appears correctly in `/frukost` and `/stad` when relevant.
5. Guest confirmation and guest page work.
6. All future Sirvoy reservations are represented in the native ledger/operations.
7. Booking.com and every other active channel block inventory correctly.
8. Reconciliation has run without unexplained mismatch.
9. Rollback path exists.
10. `/boka` is switched to native and production-verified on mobile and desktop.
11. A short stabilization window passes with no P0/P1 booking defect.

Only then remove Sirvoy widget/import dependencies and cancel the subscription.

## Product direction

The implementation should become the real-world reference implementation for StayBoost rather than a one-off glamping fork. Once proven on Bergs Slussar, move reusable booking/pricing/payment/channel logic into shared StayBoost ownership and keep property-specific presentation/configuration in the glamping site.
