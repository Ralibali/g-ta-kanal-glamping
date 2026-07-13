/**
 * Central Plausible analytics helper.
 *
 * Rules:
 *  - Plausible script (index.html, `pa-*.js`) auto-tracks pageviews for SPA
 *    navigations. Do NOT fire manual pageview events here.
 *  - Never send PII (name, email, phone, booking number, free text, unique IDs,
 *    date combinations that identify a guest). Only low-cardinality props below.
 *  - Skip tracking on internal/staff surfaces (admin, cleaning, breakfast,
 *    employee, chat).
 */

type PlausibleFn = (
  event: string,
  options?: { props?: Record<string, string | number | boolean> },
) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn & { q?: unknown[] };
  }
}

export type AnalyticsEvent =
  | "Booking Search"
  | "Booking Started"
  | "Booking Completed"
  | "Add-on Checkout Started"
  | "Add-on Purchased"
  | "Contact Click";

/** Allow-list of low-cardinality property keys. Anything else is dropped. */
const ALLOWED_KEYS = new Set([
  "language",
  "product_category",
  "payment_method",
  "source",
]);

/** Paths where tracking must be suppressed (staff / internal tools). */
const BLOCKED_PREFIXES = [
  "/admin",
  "/stad",
  "/cleaning",
  "/frukost",
  "/breakfast",
  "/jobb",
  "/chat",
];

const isBlockedPath = (path: string) =>
  BLOCKED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

const sanitizeProps = (
  props?: Record<string, unknown>,
): Record<string, string> | undefined => {
  if (!props) return undefined;
  const clean: Record<string, string> = {};
  for (const [key, raw] of Object.entries(props)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (raw == null) continue;
    const value = String(raw).trim();
    // Guard against high-cardinality / PII: length + basic pattern.
    if (!value || value.length > 40) continue;
    if (/[@]/.test(value)) continue; // never send anything email-shaped
    clean[key] = value;
  }
  return Object.keys(clean).length ? clean : undefined;
};

export interface TrackOptions {
  language?: "sv" | "en" | string;
  product_category?: "booking" | "addon" | "contact" | string;
  payment_method?: "stripe" | "swish" | "manual" | string;
  source?: string;
}

export function trackEvent(event: AnalyticsEvent, options?: TrackOptions): void {
  if (typeof window === "undefined") return;
  try {
    if (isBlockedPath(window.location.pathname)) return;
    const fn = window.plausible;
    if (typeof fn !== "function") return;
    const props = sanitizeProps(options);
    fn(event, props ? { props } : undefined);
  } catch {
    // Analytics must never break the app.
  }
}
