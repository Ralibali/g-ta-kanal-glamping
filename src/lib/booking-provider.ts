import type { Lang } from "@/i18n/LanguageContext";

export const STAYBOOST_ORIGIN = "https://stayboost.se";
export const BOOKING_CONTACT = "info@auroramedia.se";

export type BookingConfig =
  | { provider: "sirvoy" }
  | { provider: "stayboost"; slug: string }
  | { provider: "unavailable" };

// Change inventory only through an explicit build setting after the cutover checks.
// Invalid StayBoost settings must not silently reopen the old inventory.
export function resolveBookingConfig(provider?: string, slug?: string): BookingConfig {
  if (!provider || provider === "sirvoy") return { provider: "sirvoy" };
  if (provider === "stayboost" && slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { provider: "stayboost", slug };
  }
  return { provider: "unavailable" };
}

export const bookingConfig = resolveBookingConfig(
  import.meta.env.VITE_BOOKING_PROVIDER,
  import.meta.env.VITE_STAYBOOST_PROPERTY_SLUG,
);

export function stayboostBookingUrl(slug: string, lang: Lang, embedded = true) {
  const url = new URL(`/boka/${encodeURIComponent(slug)}`, STAYBOOST_ORIGIN);
  url.searchParams.set("lang", lang);
  if (embedded) url.searchParams.set("embed", "goglamping");
  return url.href;
}

export function allowedCheckoutUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.origin === "https://checkout.stripe.com" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
