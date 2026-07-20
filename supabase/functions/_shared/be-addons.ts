// Booking Engine: tillvalslogik. Klienten skickar {id, quantity}; motorn
// prissätter alltid server-side mot aktiva tillval, aldrig klientens summor.

export type AddonPriceType = "per_booking" | "per_night" | "per_guest";

export interface Addon {
  id: string;
  name: string;
  description: string | null;
  price: number;
  price_type: AddonPriceType;
  image_url: string | null;
  active: boolean;
  max_quantity: number;
  sort_order: number;
}

export interface AddonSelection {
  id: string;
  quantity: number;
}

export interface PricedAddon {
  addon: Addon;
  quantity: number;
  lineTotal: number;
}

export function addonLineTotal(
  addon: Addon,
  quantity: number,
  nights: number,
  guests: number,
): number {
  const q = Math.max(1, quantity);
  if (addon.price_type === "per_night") return addon.price * q * Math.max(1, nights);
  if (addon.price_type === "per_guest") return addon.price * q * Math.max(1, guests);
  return addon.price * q;
}

export function priceAddons(
  selections: AddonSelection[],
  available: Addon[],
  nights: number,
  guests: number,
): PricedAddon[] {
  const byId = new Map(available.filter((a) => a.active).map((a) => [a.id, a]));
  const priced: PricedAddon[] = [];
  for (const sel of selections) {
    const addon = byId.get(sel.id);
    const quantity = Math.floor(sel.quantity);
    if (!addon || !Number.isFinite(quantity) || quantity < 1) continue;
    const capped = Math.min(quantity, addon.max_quantity || 20);
    priced.push({
      addon,
      quantity: capped,
      lineTotal: addonLineTotal(addon, capped, nights, guests),
    });
  }
  return priced;
}

export function sumAddons(priced: PricedAddon[]): number {
  return priced.reduce((s, p) => s + p.lineTotal, 0);
}
