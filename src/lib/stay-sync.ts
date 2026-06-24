// Pure helpers for syncing breakfast/fikapase flags between
// Sirvoy CSV imports (tent_stays) and online tillvals-beställningar (addon_orders).
// Both sides must coexist without overwriting each other.

export type StayFlags = { breakfast?: boolean; fikapase?: boolean };

export type AddonOrderLike = {
  booking_id: string;
  status: string;
  addons?: { slug?: string | null } | null;
};

export type BookingLike = {
  id: string;
  booking_number: string;
  tent_id: string;
};

const ACTIVE_STATUSES = new Set(["paid", "confirmed", "requested"]);

/**
 * Forward sync: when an online addon order is placed, derive which tent_stays
 * flags should be flipped to true. Only sets true — never false — so a CSV
 * re-import can independently keep its own flags.
 */
export function buildTentStayPatchFromAddonSlugs(slugs: string[]): StayFlags {
  const patch: StayFlags = {};
  if (slugs.includes("breakfast")) patch.breakfast = true;
  if (slugs.includes("fika_bag")) patch.fikapase = true;
  return patch;
}

/**
 * Reverse re-apply: after a full Sirvoy CSV import wipes & rewrites tent_stays,
 * merge the still-active online addon orders back on top so paid breakfast /
 * fika_bag orders aren't lost.
 *
 * Returns a Map keyed by `${booking_number}|${tent_id}` → patch.
 */
export function buildAddonFlagsByStay(
  orders: AddonOrderLike[],
  bookings: BookingLike[],
): Map<string, StayFlags> {
  const bkMap = new Map<string, { booking_number: string; tent_id: string }>();
  for (const b of bookings) {
    bkMap.set(b.id, { booking_number: b.booking_number, tent_id: b.tent_id });
  }
  const out = new Map<string, StayFlags>();
  for (const o of orders) {
    if (!ACTIVE_STATUSES.has(o.status)) continue;
    const slug = o.addons?.slug;
    if (slug !== "breakfast" && slug !== "fika_bag") continue;
    const b = bkMap.get(o.booking_id);
    if (!b) continue;
    const key = `${b.booking_number}|${b.tent_id}`;
    const cur = out.get(key) ?? {};
    if (slug === "breakfast") cur.breakfast = true;
    if (slug === "fika_bag") cur.fikapase = true;
    out.set(key, cur);
  }
  return out;
}

/**
 * Merge a CSV-derived stay row with the addon-re-apply patch.
 * CSV flags survive (an admin-imported "frukost" line stays true), addon flags
 * are OR-ed on top. Neither side can clear the other to false here.
 */
export function mergeStayWithAddonPatch<T extends StayFlags>(
  csvStay: T,
  addonPatch: StayFlags | undefined,
): T {
  if (!addonPatch) return csvStay;
  return {
    ...csvStay,
    breakfast: !!(csvStay.breakfast || addonPatch.breakfast),
    fikapase: !!(csvStay.fikapase || addonPatch.fikapase),
  };
}
