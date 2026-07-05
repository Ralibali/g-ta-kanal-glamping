export const SOFA_BED_THRESHOLD = 2;
export const FRIDGE_WATER = 1;
export const FRIDGE_MILK = 3;
export const TOWELS_PER_GUEST = 1;
export const WINTER_MONTHS = [11, 12, 1, 2, 3];

export const ROOM_TO_TENT: Record<string, string> = {
  "1": "sjobris",
  "2": "naturkarnan",
  "3": "lugnetsyta",
};

export interface TentMeta {
  id: string;
  no: number;
  name: string;
  position: { sv: string; en: string; si: string };
}

export const TENTS: TentMeta[] = [
  { id: "sjobris", no: 1, name: "Sjöbrisretreatet", position: {
    sv: "Rakt fram", en: "Straight ahead", si: "ඉදිරියෙන්",
  }},
  { id: "naturkarnan", no: 2, name: "Naturkärnan", position: {
    sv: "Längst till vänster", en: "Far left", si: "වම් කෙළවරේ",
  }},
  { id: "lugnetsyta", no: 3, name: "Lugnets yta", position: {
    sv: "I mitten", en: "In the middle", si: "මැද",
  }},
];

export const TENT_BY_ID: Record<string, TentMeta> = Object.fromEntries(
  TENTS.map((t) => [t.id, t]),
);

export function isWinter(date: Date) {
  return WINTER_MONTHS.includes(date.getMonth() + 1);
}

export function todayInStockholm(): string {
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}
