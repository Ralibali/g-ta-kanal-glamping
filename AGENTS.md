# Agent instructions — Bergs Slussar Glamping

Read `README.md` before making changes.

## Goal

Improve real business outcomes for Bergs Slussar Glamping: more completed direct bookings, higher revenue per stay, smoother guest experience and less manual operations work.

## Critical flows

Treat these as P0/P1 surfaces:

- `/boka`
- `/frukost`
- `/stad`
- `/checka-in` / `/checkin`
- `/stay/:token`
- `/admin/*`

Do not break or redesign these casually.

## StayBoost

This glamping operation is the lighthouse customer for StayBoost. Reusable booking, breakfast, cleaning, guest and channel-sync capabilities should gradually move toward shared StayBoost architecture when that reduces duplication.

Do not perform a risky big-bang migration. Parallel-run, reconcile, verify and keep rollback.

## Working method

1. Inspect current production and current `main`.
2. Inspect open PRs before starting duplicate work.
3. Identify one high-value bottleneck.
4. Implement the smallest complete fix.
5. Run lint, tests and build.
6. Verify in preview/browser.
7. Deploy only when critical flows pass.
8. Verify production and measure the result.

## Guardrails

- Never commit secrets or `.env` files.
- Never expose Supabase service-role keys or payment credentials.
- Booking/channel changes must fail safe against double bookings.
- Preserve existing URLs and SEO intent.
- Prefer qualified booking conversion over vanity traffic.
- Prefer operational automation over another dashboard.
- Do not mass-produce SEO pages or content without proven search/business intent.
- Do not change pricing, refund rules or other material commercial terms without owner approval.

## Current operational emphasis

`/frukost` and `/stad` are heavily used real-world workflows. Optimize them for fast mobile use, clear exception handling, persistent state and minimal taps.
