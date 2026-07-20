// Frontend-kopia av booking engine-prissättningen (delas med edge function).
// Ren TS utan Deno-beroenden.

export interface UnitPricing {
  base_price: number;
  weekend_pct: number;
  cleaning_fee: number;
  monthly_mult: number[];
}

export interface StayQuote {
  nights: number;
  nightly: { date: string; price: number }[];
  subtotal: number;
  cleaningFee: number;
  total: number;
}

const parseIso = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
};

const isoOf = (t: number) => new Date(t).toISOString().slice(0, 10);

export function nightsBetween(checkin: string, checkout: string): string[] {
  const { y, m, d } = parseIso(checkin);
  const out: string[] = [];
  for (let t = Date.UTC(y, m - 1, d); isoOf(t) < checkout; t += 86400000) {
    out.push(isoOf(t));
  }
  return out;
}

export function isWeekendNight(iso: string): boolean {
  const { y, m, d } = parseIso(iso);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return wd === 5 || wd === 6;
}

export function nightlyPrice(u: UnitPricing, iso: string): number {
  const { m } = parseIso(iso);
  const mult = Number(u.monthly_mult[m - 1] ?? 100) / 100;
  const weekend = isWeekendNight(iso) ? 1 + u.weekend_pct / 100 : 1;
  return Math.round((u.base_price * mult * weekend) / 5) * 5;
}

export function quoteStay(u: UnitPricing, checkin: string, checkout: string): StayQuote {
  const nightly = nightsBetween(checkin, checkout).map((date) => ({
    date, price: nightlyPrice(u, date),
  }));
  const subtotal = nightly.reduce((s, n) => s + n.price, 0);
  return {
    nights: nightly.length, nightly, subtotal,
    cleaningFee: u.cleaning_fee,
    total: subtotal + u.cleaning_fee,
  };
}

export function rangesOverlap(aFrom: string, aTo: string, bFrom: string, bTo: string): boolean {
  return aFrom < bTo && bFrom < aTo;
}
