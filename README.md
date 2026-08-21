# Bergs Slussar Glamping

Production website and operations app for **Bergs Slussar Glamping** at the Göta Canal outside Linköping.

Public site: `https://goglampingsweden.se`

## Product surfaces

This repository is not only a marketing site. It also contains operational flows used by the glamping business.

Production-critical routes include:

- `/boka` — direct booking funnel / Sirvoy booking surface
- `/frukost` — breakfast operations
- `/stad` — cleaning operations portal
- `/checka-in` and `/checkin` — guest check-in
- `/stay/:token` — guest stay page
- `/admin/*` — operations/admin
- `/blogg` and SEO landing pages — organic acquisition

Treat changes to booking, breakfast, cleaning, guest access, payments and admin as production-sensitive.

## Tech

- React 18
- TypeScript
- Vite
- Tailwind / shadcn-ui
- Supabase
- React Query
- React Router
- Vitest
- Bun / npm lockfiles are currently present; CI uses Bun

## Integrations

The application contains integrations for business-critical flows such as:

- Supabase data/auth
- Sirvoy booking widget
- booking/check-in operations
- site analytics stored in Supabase
- guest communication and operational tooling

Do not replace an existing integration only because a new implementation looks cleaner. Preserve production behaviour until the replacement is verified end-to-end.

## Local development

```bash
bun install --frozen-lockfile
bun run dev
```

Validation before merge:

```bash
bun run lint
bun run test
bun run build
```

All three checks are intended to be merge gates.

## Environment variables and secrets

Never commit `.env` files, private API keys, service-role keys, payment secrets or credentials.

Use local/hosting environment configuration. `.env.example` may document variable names but must never contain production credentials.

If a secret is ever committed to Git history, removing the file from the latest commit is not enough: rotate the affected credential and clean history if appropriate.

## Business priorities

When improving this repository, prioritize in this order:

1. Booking reliability and completed direct bookings
2. Guest experience and operational reliability
3. `/frukost` and `/stad` workflows
4. Reduced manual administration
5. Conversion rate and mobile UX
6. Revenue per stay / useful add-ons
7. SEO that leads to qualified booking intent
8. Cosmetic improvements

Do not create features merely to increase feature count.

## StayBoost relationship

Bergs Slussar Glamping is the ideal real-world lighthouse environment for StayBoost.

Long-term direction:

- keep the glamping site highly converting and guest-facing
- progressively let StayBoost own reusable booking/guest/operations capabilities
- use real Bergs Slussar stays to validate breakfast, cleaning, add-ons, channel reconciliation and automation
- avoid duplicating the same business logic permanently in two products

Any migration from an existing working flow to StayBoost must be parallel-tested and reversible before cutover.

## Agent rules

Before starting a large audit, first inspect current `main`, open PRs and production behaviour. Do not redo work already implemented or create parallel versions of the same flow.

Prefer:

`real production problem → smallest valuable fix → tests → build → preview → production verification → measure`

For booking/channel work, reliability and avoiding double bookings are more important than architectural elegance.
