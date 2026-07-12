# StayBoost Stats Public API

Public, aggregate-only statistics endpoint for the StayBoost case study.

## Endpoint

```
GET https://cmqajoqwafkjyvfbgsmq.supabase.co/functions/v1/stayboost-stats
```

No authentication required. Only aggregated numbers are returned — never booking numbers, names, emails, phone numbers, raw payloads or payment identifiers.

## CORS

Allowed origins:
- `https://stayboost-sverige.lovable.app`
- `https://goglampingsweden.se` / `www.goglampingsweden.se`
- `https://bergsslussarglamping.lovable.app`
- The project preview domain (`*.lovable.app`)
- `http://localhost:*` / `http://127.0.0.1:*` for local development

## Caching & rate limits

- `Cache-Control: public, max-age=300, stale-while-revalidate=3600`
- In-memory per-IP rate limit: 60 requests / minute (returns HTTP 429)

## Response shape

```json
{
  "bookings2026": 0,
  "uniqueGuests": 0,
  "guestNights": 0,
  "bookingValueSek": 0,
  "paidAddonOrders": 0,
  "paidAddonRevenueSek": 0,
  "avgPaidAddonSek": 0,
  "prearrivalMessages": { "sent": 0, "total": 0 },
  "digitalCheckIns": 0,
  "breakfastDeliveries": { "done": 0, "total": 0 },
  "sms": { "sent": 0, "total": 0 },
  "traffic": { "pageViews": 0, "sessions": 0, "clickEvents": 0 },
  "addonDistribution": [
    { "slug": "breakfast", "name": "Frukost", "orders": 0, "units": 0, "revenue": 0 }
  ],
  "updatedAt": "2026-07-12T00:00:00.000Z"
}
```

Missing tables or transient errors degrade gracefully to `0` / empty arrays — the response shape is stable.

## Guarantees

- SELECT-only. No inserts, updates or deletes.
- No personal identifiers ever leave the endpoint. `uniqueGuests` is computed by hashing email/phone into an in-memory `Set` and only the resulting `size` is returned.
