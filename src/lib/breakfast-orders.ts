export type BreakfastStayInput = {
  booking_number: string;
  tent_id: string;
  checkin_date: string;
  checkout_date: string;
  guests: number | null;
  guest_name: string | null;
  dietary: string[] | null;
  dietary_note: string | null;
  breakfast_csv_quantity: number | null;
  breakfast_addon_quantity: number | null;
  fikapase_csv_quantity: number | null;
  fikapase_addon_quantity: number | null;
};

export type BreakfastBookingInput = {
  booking_number: string;
  guest_name: string | null;
  raw: unknown;
};

export type BreakfastDeliveryInput = {
  booking_number: string;
  delivery_date: string;
  kind: string;
  status: string;
  sms_status: string | null;
  delivered_at: string | null;
};

export type BreakfastOrder = {
  key: string;
  bookingNumber: string;
  guestName: string | null;
  tentIds: string[];
  date: string;
  kind: "breakfast" | "fikapase";
  quantity: number;
  csvQuantity: number;
  addonQuantity: number;
  dietary: string[];
  dietaryNote: string | null;
  warning: string | null;
  delivery?: BreakfastDeliveryInput;
};

const DIETARY_PATTERNS: Array<{ id: string; re: RegExp }> = [
  { id: "gluten_free", re: /\b(glutenfri|gluten\s*fri|gluten[-\s]?free|coeliac|celiaki)\b/i },
  { id: "vegan", re: /\b(vegan|veganskt|veganisch|vegano)\b/i },
  { id: "vegetarian", re: /\b(vegetar|vegetariskt|veggie)\b/i },
  { id: "lactose_free", re: /\b(laktosfri|laktos\s*fri|lactose[-\s]?free|mjölkfri|mjolkfri|dairy[-\s]?free)\b/i },
  { id: "nut_allergy", re: /\b(nötallergi|notallergi|nut\s*allergy|nötter|peanut|jordnöt|hassel|cashew|mandel)\b/i },
];

const NUMBER_WORDS: Record<string, number> = {
  en: 1,
  ett: 1,
  one: 1,
  två: 2,
  tva: 2,
  two: 2,
  tre: 3,
  three: 3,
  fyra: 4,
  four: 4,
  fem: 5,
  five: 5,
  sex: 6,
  six: 6,
  sju: 7,
  seven: 7,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function getInsensitive(record: Record<string, unknown> | null, names: string[]): string {
  if (!record) return "";
  const wanted = new Set(names.map((name) => name.toLowerCase().trim()));
  for (const [key, value] of Object.entries(record)) {
    if (wanted.has(key.toLowerCase().trim())) return String(value ?? "").trim();
  }
  return "";
}

export function extractBookingNotes(raw: unknown): { guestComment: string; internalNote: string; combined: string } {
  const root = asRecord(raw);
  const basic = asRecord(root?.basic_info);
  const guestComment = getInsensitive(basic, ["Guest comment", "Guest comments", "Comments", "Kommentar"]);
  const internalNote = getInsensitive(basic, ["Internal note", "Note", "Notering"]);
  return {
    guestComment,
    internalNote,
    combined: [guestComment, internalNote].filter(Boolean).join("\n"),
  };
}

function dietaryFromText(text: string): string[] {
  return DIETARY_PATTERNS.filter(({ re }) => re.test(text)).map(({ id }) => id);
}

function dateDiff(checkin: string, checkout: string): number {
  const start = Date.parse(`${checkin}T12:00:00Z`);
  const end = Date.parse(`${checkout}T12:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1;
  return Math.max(1, Math.round((end - start) / 86_400_000));
}

function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function parseNumberToken(token: string): number | null {
  const normalized = token.toLowerCase().trim();
  if (/^\d+$/.test(normalized)) return Number(normalized);
  return NUMBER_WORDS[normalized] ?? null;
}

export function parseExplicitBreakfastDays(text: string): number | null {
  const normalized = text.toLowerCase();
  const token = "(\\d+|en|ett|one|två|tva|two|tre|three|fyra|four|fem|five|sex|six|sju|seven)";
  const patterns = [
    new RegExp(`frukost[^.\\n]{0,80}(?:för|i)\\s+${token}\\s+(?:dag|dagar|morgon|morgnar)`, "i"),
    new RegExp(`breakfast[^.\\n]{0,80}(?:for)\\s+${token}\\s+(?:day|days|morning|mornings)`, "i"),
    new RegExp(`${token}\\s+(?:dag|dagar|morgon|morgnar)[^.\\n]{0,80}frukost`, "i"),
    new RegExp(`${token}\\s+(?:day|days|morning|mornings)[^.\\n]{0,80}breakfast`, "i"),
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;
    const candidate = match.slice(1).find((part) => part && (NUMBER_WORDS[part] || /^\d+$/.test(part)));
    if (!candidate) continue;
    const value = parseNumberToken(candidate);
    if (value && value > 0) return value;
  }
  return null;
}

type PlannedPart = { date: string; csv: number; addon: number; warning: string | null };

export function planBreakfastDates(args: {
  checkin: string;
  checkout: string;
  totalGuests: number;
  csvQuantity: number;
  addonQuantity: number;
  notes: string;
}): PlannedPart[] {
  const { checkin, checkout, totalGuests, csvQuantity, addonQuantity, notes } = args;
  const nights = dateDiff(checkin, checkout);
  const byDate = new Map<string, PlannedPart>();
  const add = (date: string, source: "csv" | "addon", quantity: number, warning: string | null = null) => {
    if (quantity <= 0) return;
    const current = byDate.get(date) ?? { date, csv: 0, addon: 0, warning: null };
    current[source] += quantity;
    current.warning = current.warning ?? warning;
    byDate.set(date, current);
  };

  if (csvQuantity > 0) {
    const explicitDays = parseExplicitBreakfastDays(notes);
    const days = explicitDays && explicitDays <= nights ? explicitDays : null;

    if (nights > 1 && days && csvQuantity % days === 0) {
      const perDay = csvQuantity / days;
      for (let day = 1; day <= days; day += 1) add(addDays(checkin, day), "csv", perDay);
    } else if (nights > 1 && totalGuests > 0 && csvQuantity === totalGuests * nights) {
      for (let day = 1; day <= nights; day += 1) add(addDays(checkin, day), "csv", totalGuests);
    } else {
      const warning = nights > 1
        ? `Kontrollera frukostdag: ${csvQuantity} portioner över ${nights} nätter kunde inte fördelas säkert.`
        : null;
      add(checkout, "csv", csvQuantity, warning);
    }
  }

  // Webbtillägg = portioner per morgon. Levereras varje morgon under vistelsen (checkin+1 … checkout).
  if (addonQuantity > 0) {
    for (let day = 1; day <= nights; day += 1) add(addDays(checkin, day), "addon", addonQuantity);
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function buildBreakfastOrders(
  stays: BreakfastStayInput[],
  bookings: BreakfastBookingInput[],
  deliveries: BreakfastDeliveryInput[],
): BreakfastOrder[] {
  const bookingMap = new Map(bookings.map((booking) => [booking.booking_number, booking]));
  const groups = new Map<string, BreakfastStayInput[]>();

  for (const stay of stays) {
    const key = `${stay.booking_number}|${stay.checkin_date}|${stay.checkout_date}`;
    groups.set(key, [...(groups.get(key) ?? []), stay]);
  }

  const orders: BreakfastOrder[] = [];
  for (const rows of groups.values()) {
    const first = rows[0];
    const booking = bookingMap.get(first.booking_number);
    const notes = extractBookingNotes(booking?.raw);
    const tentIds = Array.from(new Set(rows.map((row) => row.tent_id)));
    const totalGuests = rows.reduce((sum, row) => sum + Number(row.guests ?? 0), 0);
    const csvBreakfast = rows.reduce((sum, row) => sum + Number(row.breakfast_csv_quantity ?? 0), 0);
    const addonBreakfast = rows.reduce((sum, row) => sum + Number(row.breakfast_addon_quantity ?? 0), 0);
    const csvFika = rows.reduce((sum, row) => sum + Number(row.fikapase_csv_quantity ?? 0), 0);
    const addonFika = rows.reduce((sum, row) => sum + Number(row.fikapase_addon_quantity ?? 0), 0);
    const stayDietary = rows.flatMap((row) => row.dietary ?? []);
    const noteDietary = dietaryFromText(notes.combined);
    const dietary = Array.from(new Set([...stayDietary, ...noteDietary]));
    const stayNotes = rows.map((row) => row.dietary_note).filter(Boolean) as string[];
    const relevantBookingNote = noteDietary.length > 0 ? notes.combined : "";
    const dietaryNote = Array.from(new Set([...stayNotes, relevantBookingNote].filter(Boolean))).join(" • ") || null;

    for (const part of planBreakfastDates({
      checkin: first.checkin_date,
      checkout: first.checkout_date,
      totalGuests,
      csvQuantity: csvBreakfast,
      addonQuantity: addonBreakfast,
      notes: notes.combined,
    })) {
      orders.push({
        key: `${first.booking_number}|${part.date}|breakfast`,
        bookingNumber: first.booking_number,
        guestName: booking?.guest_name ?? first.guest_name,
        tentIds,
        date: part.date,
        kind: "breakfast",
        quantity: part.csv + part.addon,
        csvQuantity: part.csv,
        addonQuantity: part.addon,
        dietary,
        dietaryNote,
        warning: part.warning,
        delivery: deliveries.find((delivery) =>
          delivery.booking_number === first.booking_number &&
          delivery.delivery_date === part.date &&
          delivery.kind === "breakfast"
        ),
      });
    }

    if (csvFika + addonFika > 0) {
      orders.push({
        key: `${first.booking_number}|${first.checkin_date}|fikapase`,
        bookingNumber: first.booking_number,
        guestName: booking?.guest_name ?? first.guest_name,
        tentIds,
        date: first.checkin_date,
        kind: "fikapase",
        quantity: csvFika + addonFika,
        csvQuantity: csvFika,
        addonQuantity: addonFika,
        dietary,
        dietaryNote,
        warning: null,
        delivery: deliveries.find((delivery) =>
          delivery.booking_number === first.booking_number &&
          delivery.delivery_date === first.checkin_date &&
          delivery.kind === "fikapase"
        ),
      });
    }
  }

  return orders.sort((a, b) => a.date.localeCompare(b.date) || a.bookingNumber.localeCompare(b.bookingNumber) || a.kind.localeCompare(b.kind));
}
