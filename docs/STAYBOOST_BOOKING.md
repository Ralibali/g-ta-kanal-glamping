# StayBoost on the Glamping website

The website supports an explicit choice between Sirvoy and StayBoost. Sirvoy remains the default until a verified cutover. No visitor query parameter or preview link can change the production booking provider.

## Build configuration

For this website:

```env
VITE_BOOKING_PROVIDER=sirvoy
VITE_STAYBOOST_PROPERTY_SLUG=
```

To prepare a separate local/preview build of StayBoost, set:

```env
VITE_BOOKING_PROVIDER=stayboost
VITE_STAYBOOST_PROPERTY_SLUG=anlaggning-c96440
```

The current property slug is `anlaggning-c96440`; verify the property before activation. The repaired StayBoost frontend defaults to this public property identifier; `VITE_GOGLAMPING_PROPERTY_SLUG` remains an optional override. Its embed handshake accepts only the exact parent origin `https://goglampingsweden.se`. A localhost or Lovable preview origin deliberately does not receive that production handshake: local previews can verify layout and failure handling, while the complete handshake needs verification on the approved production origin or an isolated browser test with that origin.

Example local preview (does not change production):

```sh
VITE_BOOKING_PROVIDER=stayboost VITE_STAYBOOST_PROPERTY_SLUG=anlaggning-c96440 bun run dev -- --host 127.0.0.1 --port 4182
```

These variables are public build settings, not secrets. Changing them requires rebuilding/publishing the corresponding frontend. Publishing the site does not deploy StayBoost's backend functions.

## Integration behavior

- The home page and Swedish, English and German booking routes use one provider setting.
- StayBoost loads only after the visitor opens its form. Language is forwarded through `lang=sv|en|de`.
- The parent accepts `stayboost:ready`, `stayboost:error` and checkout messages only from the currently mounted iframe at exactly `https://stayboost.se`.
- A frame load alone is not readiness. A backend error/paused booking or missing handshake shows help and a retry action. The separate-window link remains available.
- Payment navigation is allowed only to HTTPS `checkout.stripe.com`, with no URL credentials or nonstandard port. The website never creates payments itself.
- StayBoost selection removes the homepage's Sirvoy availability and management widgets. Existing guests are directed to their confirmation's guest link or the existing contact address.
- Invalid provider settings fail closed. StayBoost errors never silently open Sirvoy's separate inventory.

## Before the production switch

1. Confirm all three real tents, capacities, person/child prices, seasonal rules, minimum stays, add-ons and terms against the operator's authoritative setup. Current website marketing and the incomplete StayBoost configuration are not sufficient pricing evidence.
2. Import/reconcile future Sirvoy bookings and map each Booking.com/Airbnb feed to its correct tent. Verify reserved dates and fresh sync results.
3. Verify the configured payment methods, a controlled booking, confirmation delivery and guest-link flow. Reconcile or remove test records through the supported workflow.
4. Verify that StayBoost can take bookings and that the approved-origin embed sends `stayboost:ready` only after the booking engine reports usable inventory. Confirm errors and Stripe redirects in the browser.
5. Stop new sales in the old inventory as part of the coordinated cutover, then explicitly set the website provider to StayBoost and publish. Read back the public booking pages.

Rolling back to Sirvoy is another inventory cutover: reconcile any bookings accepted by StayBoost before restoring the old provider. A technical publish rollback alone is not a safe inventory rollback.

## Evidence, 5 October 2026

Before this change the connected website source was `7039b3fc20480d4ca79c052a2d60f1b24eacd641` in `Ralibali/g-ta-kanal-glamping`, and the public bundle used Sirvoy form `9482eece181add59`. The public StayBoost booking bundle contained the embed protocol but its configured Glamping slug was compiled as `undefined`. These observations are not a completed cutover or payment verification.
