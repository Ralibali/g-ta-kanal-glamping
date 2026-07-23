// Beräknar OB-tillägg enligt Gröna riksavtalet (hotell & besöksnäring)
// Regler:
//  - Vardag (mån–fre) efter kl. 20.00: +27,59 kr/h
//  - Lördag från kl. 12.00: +27,59 kr/h
//  - Söndag och röda dagar hela dagen: +27,59 kr/h
//  - Natt kl. 01.00–06.00 (alla dagar): sammanlagt +51,90 kr/h (ersätter övriga OB-nivåer)
// Tider tolkas i Europe/Stockholm.

export const OB_EVENING_RATE = 27.59;
export const OB_NIGHT_RATE = 51.9;

export type TimeEntryLike = {
  started_at: string;
  ended_at: string | null;
};

export type ObBreakdown = {
  totalHours: number;
  regularHours: number;
  eveningObHours: number;
  nightObHours: number;
  obEveningAmount: number;
  obNightAmount: number;
  obTotal: number;
};

// Svenska röda dagar (fasta + rörliga för 2025–2028). Julafton, midsommarafton
// och nyårsafton räknas som helgdag i Gröna riksavtalet.
const FIXED_HOLIDAYS = [
  "01-01", // Nyårsdagen
  "01-06", // Trettondedag jul
  "05-01", // Första maj
  "06-06", // Nationaldagen
  "12-24", // Julafton
  "12-25", // Juldagen
  "12-26", // Annandag jul
  "12-31", // Nyårsafton
];

const EASTER_SUNDAY: Record<number, string> = {
  2025: "2025-04-20",
  2026: "2026-04-05",
  2027: "2027-03-28",
  2028: "2028-04-16",
};

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function movableHolidays(year: number): string[] {
  const easter = EASTER_SUNDAY[year];
  if (!easter) return [];
  const goodFriday = addDays(easter, -2);
  const easterMonday = addDays(easter, 1);
  const ascension = addDays(easter, 39);
  const pentecost = addDays(easter, 49);
  // Midsommarafton = fredag 19–25 juni; midsommardagen = lördag 20–26 juni
  const midsummerEve = (() => {
    for (let day = 19; day <= 25; day++) {
      const iso = `${year}-06-${String(day).padStart(2, "0")}`;
      const dow = new Date(`${iso}T12:00:00Z`).getUTCDay();
      if (dow === 5) return iso;
    }
    return null;
  })();
  const midsummerDay = midsummerEve ? addDays(midsummerEve, 1) : null;
  // Alla helgons dag: lördag 31 okt – 6 nov
  const allSaints = (() => {
    for (let m = 10, day = 31; day <= 37; day++) {
      const realDay = day <= 31 ? day : day - 31;
      const month = day <= 31 ? m : m + 1;
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(realDay).padStart(2, "0")}`;
      const dow = new Date(`${iso}T12:00:00Z`).getUTCDay();
      if (dow === 6) return iso;
    }
    return null;
  })();
  return [easter, goodFriday, easterMonday, ascension, pentecost, midsummerEve, midsummerDay, allSaints].filter(
    (x): x is string => !!x,
  );
}

export function isSwedishHoliday(iso: string): boolean {
  const year = Number(iso.slice(0, 4));
  const md = iso.slice(5);
  if (FIXED_HOLIDAYS.includes(md)) return true;
  return movableHolidays(year).includes(iso);
}

// Konverterar en UTC-tidpunkt till {iso-datum, minuter-sedan-midnatt, veckodag} i Europe/Stockholm.
function toStockholmParts(date: Date): { iso: string; minutes: number; dow: number } {
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const iso = `${get("year")}-${get("month")}-${get("day")}`;
  const minutes = Number(get("hour")) * 60 + Number(get("minute")) + Number(get("second")) / 60;
  // Bygg dow från datumet (undvik locale-beroende weekday-strings)
  const dow = new Date(`${iso}T12:00:00Z`).getUTCDay(); // 0=sön..6=lör
  return { iso, minutes, dow };
}

// Returnerar OB-sats (kr/h) för en given minut inom ett dygn i Stockholm.
function obRateFor(iso: string, minute: number, dow: number): number {
  // Natt 01:00–06:00 gäller alltid, oavsett veckodag
  if (minute >= 60 && minute < 360) return OB_NIGHT_RATE;
  const holiday = isSwedishHoliday(iso);
  if (dow === 0 || holiday) return OB_EVENING_RATE; // söndag / röd dag
  if (dow === 6) {
    // lördag från 12:00
    return minute >= 12 * 60 ? OB_EVENING_RATE : 0;
  }
  // vardag efter 20:00
  return minute >= 20 * 60 ? OB_EVENING_RATE : 0;
}

export function computeObForEntry(startIso: string, endIso: string): {
  totalHours: number;
  eveningObHours: number;
  nightObHours: number;
} {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (!(end > start)) return { totalHours: 0, eveningObHours: 0, nightObHours: 0 };

  // Iterera minut för minut (billigt för normala pass < 24h)
  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  let evening = 0;
  let night = 0;
  for (let i = 0; i < totalMinutes; i++) {
    const t = new Date(start.getTime() + i * 60000 + 30000); // sample mid-minute
    const { iso, minutes, dow } = toStockholmParts(t);
    const rate = obRateFor(iso, minutes, dow);
    if (rate === OB_NIGHT_RATE) night += 1;
    else if (rate === OB_EVENING_RATE) evening += 1;
  }
  return {
    totalHours: totalMinutes / 60,
    eveningObHours: evening / 60,
    nightObHours: night / 60,
  };
}

export function computeObBreakdown(entries: TimeEntryLike[]): ObBreakdown {
  let total = 0;
  let evening = 0;
  let night = 0;
  for (const e of entries) {
    if (!e.ended_at) continue;
    const r = computeObForEntry(e.started_at, e.ended_at);
    total += r.totalHours;
    evening += r.eveningObHours;
    night += r.nightObHours;
  }
  const obEveningAmount = evening * OB_EVENING_RATE;
  const obNightAmount = night * OB_NIGHT_RATE;
  return {
    totalHours: total,
    regularHours: total - evening - night,
    eveningObHours: evening,
    nightObHours: night,
    obEveningAmount,
    obNightAmount,
    obTotal: obEveningAmount + obNightAmount,
  };
}
