export type SirvoyFileKind = "booking_content" | "basic_info" | "unknown";

export type CsvRow = Record<string, string | undefined>;

export type ParsedBooking = {
  booking_number: string;
  guest_name?: string | null;
  guest_first_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  country_code?: string | null;
  checkin_date?: string | null;
  checkout_date?: string | null;
  tent_id?: string | null;
  tent_name?: string | null;
  amount?: number | null;
  lang?: string | null;
  language?: string | null;
  nights?: number | null;
  sirvoy_booking_no?: string | null;
  raw?: Record<string, unknown>;
  /** Import-only metadata; never written directly to bookings. */
  children_total?: number;
  number_of_guests?: number;
  number_of_rooms?: number;
};

export type ParsedTentStay = {
  booking_number: string;
  room_id: string | null;
  tent_id: string;
  checkin_date: string;
  checkout_date: string;
  adults: number;
  children: number;
  guests: number;
  breakfast: boolean;
  fikapase: boolean;
  late_checkout: boolean;
  late_checkout_csv: boolean;
  breakfast_csv_quantity: number;
  breakfast_addon_quantity: number;
  fikapase_csv_quantity: number;
  fikapase_addon_quantity: number;
  guest_name: string | null;
  phone: string | null;
  email: string | null;
  lang: string;
  note: string | null;
  dietary: string[];
  dietary_note: string | null;
  raw: Record<string, unknown>;
  import_source: string;
  imported_at: string;
};

export type ParsedBasicInfo = {
  bookings: ParsedBooking[];
  contacts: Map<string, ParsedBooking>;
  validPhones: number;
  missingPhones: number;
};

export type ParsedBookingContent = {
  bookings: ParsedBooking[];
  stays: ParsedTentStay[];
  bookingNumbers: string[];
  breakfastPortions: number;
  fikaBags: number;
  warnings: string[];
};

const SUPPORTED_LANGS = new Set(["sv", "da", "en", "no", "de", "nl", "fr"]);
const ROOM_TO_TENT: Record<string, { id: string; name: string }> = {
  "1": { id: "sjobris", name: "Sjöbrisretreatet" },
  "2": { id: "naturkarnan", name: "Naturkärnan" },
  "3": { id: "lugnetsyta", name: "Lugnets yta" },
};

const DIETARY_PATTERNS: Array<{ id: string; re: RegExp }> = [
  { id: "gluten_free", re: /\b(glutenfri|gluten\s*fri|gluten[-\s]?free|coeliac|celiaki)\b/i },
  { id: "vegan", re: /\b(vegan|veganskt|veganisch|vegano)\b/i },
  { id: "vegetarian", re: /\b(vegetar|vegetariskt|veggie)\b/i },
  { id: "lactose_free", re: /\b(laktosfri|laktos\s*fri|lactose[-\s]?free|mjölkfri|mjolkfri|dairy[-\s]?free)\b/i },
  { id: "nut_allergy", re: /\b(nötallergi|notallergi|nut\s*allergy|nötter|peanut|jordnöt|hassel|cashew|mandel)\b/i },
];

export function normaliseHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .trim()
    .replace(/[_\-.]/g, " ")
    .replace(/\s+/g, " ");
}

function lookupRow(row: CsvRow): Record<string, string> {
  const lookup: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const normalized = normaliseHeader(key);
    if (!normalized || normalized.startsWith("unnamed")) continue;
    lookup[normalized] = String(value ?? "").trim();
  }
  return lookup;
}

function get(lookup: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const value = lookup[normaliseHeader(key)];
    if (value) return value;
  }
  return "";
}

export function detectSirvoyFile(headers: string[]): SirvoyFileKind {
  const set = new Set(headers.map(normaliseHeader).filter(Boolean));
  const has = (...names: string[]) => names.some((name) => set.has(normaliseHeader(name)));

  if (
    has("type", "typ") &&
    has("booking no", "booking no.", "bokningsnummer") &&
    has("specification", "kategori") &&
    has("room id", "room") &&
    has("units")
  ) {
    return "booking_content";
  }

  if (
    has("booking no", "booking no.", "bokningsnummer") &&
    has("phone", "telefon") &&
    has("email", "e-post") &&
    has("number of guests", "antal gäster")
  ) {
    return "basic_info";
  }

  return "unknown";
}

export function normalizePhone(raw: string | null | undefined): string | null {
  let value = String(raw ?? "").trim();
  if (!value) return null;

  value = value.replace(/^['’]+/, "").trim();
  if (!value) return null;

  const startsWithPlus = value.startsWith("+");
  const startsWithDoubleZero = value.startsWith("00");
  let digits = value.replace(/\D/g, "");
  if (!digits) return null;

  if (startsWithDoubleZero) digits = digits.slice(2);
  else if (!startsWithPlus && digits.startsWith("0")) digits = `46${digits.slice(1)}`;

  if (digits.length < 7 || digits.length > 15 || digits.startsWith("0")) return null;
  return `+${digits}`;
}

export function normalizeLanguage(raw: string | null | undefined): string {
  const lang = String(raw ?? "").trim().toLowerCase().slice(0, 2);
  if (lang === "nb" || lang === "nn") return "no";
  return SUPPORTED_LANGS.has(lang) ? lang : "sv";
}

export function parseDateOnly(raw: string | null | undefined): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  return null;
}

function parseNumber(raw: string | null | undefined): number | null {
  const value = String(raw ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseInteger(raw: string | null | undefined, fallback = 0): number {
  const value = parseInt(String(raw ?? "").trim(), 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function detectTent(roomId: string, specification: string): { id: string; name: string } | null {
  const byRoom = ROOM_TO_TENT[roomId.trim()];
  if (byRoom) return byRoom;

  const text = specification.toLowerCase();
  if (text.includes("sjö") || text.includes("sjo") || text.includes("bris")) return ROOM_TO_TENT["1"];
  if (text.includes("natur") || text.includes("kärn") || text.includes("karn")) return ROOM_TO_TENT["2"];
  if (text.includes("lugn")) return ROOM_TO_TENT["3"];
  return null;
}

function parseDietary(text: string): string[] {
  return DIETARY_PATTERNS.filter(({ re }) => re.test(text)).map(({ id }) => id);
}

function parseChildrenFromNotes(text: string): number {
  const normalized = text.trim();
  if (!normalized) return 0;
  const explicit = normalized.match(/includes\s+(\d+)\s+child(?:\(ren\))?/i);
  if (explicit) return parseInteger(explicit[1], 0);
  const swedish = normalized.match(/(?:antal\s+)?barn\s*[:=]?\s*(\d+)/i);
  if (swedish) return parseInteger(swedish[1], 0);
  return 0;
}

function cleanAddressPart(value: string): string {
  const trimmed = value.trim();
  return trimmed === "." || trimmed === "-" ? "" : trimmed;
}

function fullName(first: string, last: string, combined = ""): string | null {
  return combined.trim() || [first.trim(), last.trim()].filter(Boolean).join(" ") || null;
}

function nightsBetween(checkin: string | null, checkout: string | null): number | null {
  if (!checkin || !checkout) return null;
  const start = Date.parse(`${checkin}T12:00:00Z`);
  const end = Date.parse(`${checkout}T12:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return Math.round((end - start) / 86_400_000);
}

export function parseBasicInfo(rows: CsvRow[]): ParsedBasicInfo {
  const bookings: ParsedBooking[] = [];
  const contacts = new Map<string, ParsedBooking>();
  let validPhones = 0;
  let missingPhones = 0;

  for (const row of rows) {
    const l = lookupRow(row);
    const bookingNumber = get(l, "booking no.", "booking no", "bokningsnummer").toUpperCase();
    if (!bookingNumber) continue;

    const first = get(l, "first name", "förnamn");
    const last = get(l, "last name", "efternamn");
    const phone = normalizePhone(get(l, "phone", "telefon", "mobile", "mobil"));
    const email = get(l, "email", "e-post", "epost", "mail").trim().toLowerCase() || null;
    const checkin = parseDateOnly(get(l, "check-in", "checkin", "incheckning"));
    const checkout = parseDateOnly(get(l, "check-out", "checkout", "utcheckning"));
    const lang = normalizeLanguage(get(l, "language", "språk", "lang"));
    const country = get(l, "country", "land").toUpperCase() || null;
    const internalNote = get(l, "internal note", "note", "notering");
    const guestComment = get(l, "guest comment", "guest comments", "comments", "kommentar");
    const childrenTotal = parseChildrenFromNotes(`${internalNote} ${guestComment}`);
    const numberOfGuests = parseInteger(get(l, "number of guests", "antal gäster"), 0);
    const numberOfRooms = parseInteger(get(l, "number of rooms", "antal rum"), 0);
    const address = [
      cleanAddressPart(get(l, "address", "adress")),
      [cleanAddressPart(get(l, "postal code", "postnummer")), cleanAddressPart(get(l, "city", "stad", "ort"))].filter(Boolean).join(" "),
      cleanAddressPart(country ?? ""),
    ].filter(Boolean).join(", ") || null;

    if (phone) validPhones += 1;
    else missingPhones += 1;

    const booking: ParsedBooking = {
      booking_number: bookingNumber,
      sirvoy_booking_no: bookingNumber,
      guest_name: fullName(first, last),
      guest_first_name: first || null,
      email,
      phone,
      address,
      country_code: country,
      checkin_date: checkin,
      checkout_date: checkout,
      amount: parseNumber(get(l, "total", "belopp")),
      lang,
      language: lang,
      nights: nightsBetween(checkin, checkout),
      raw: { basic_info: row, children_total: childrenTotal, number_of_guests: numberOfGuests, number_of_rooms: numberOfRooms },
      children_total: childrenTotal,
      number_of_guests: numberOfGuests,
      number_of_rooms: numberOfRooms,
    };

    bookings.push(booking);
    contacts.set(bookingNumber, booking);
  }

  return { bookings, contacts, validPhones, missingPhones };
}

type ExtraTotals = {
  children: number;
  breakfast: number;
  fika: number;
  lateCheckout: boolean;
  earlyCheckin: boolean;
  dietary: Set<string>;
  notes: string[];
  rows: CsvRow[];
};

export function parseBookingContent(rows: CsvRow[], contacts = new Map<string, ParsedBooking>()): ParsedBookingContent {
  const normalized = rows.map((row) => ({ row, l: lookupRow(row) }));
  const extras = new Map<string, ExtraTotals>();
  const accommodationByBooking = new Map<string, Array<{ row: CsvRow; l: Record<string, string> }>>();
  const allRowsByBooking = new Map<string, CsvRow[]>();
  const warnings: string[] = [];

  const getExtras = (bookingNumber: string): ExtraTotals => {
    const existing = extras.get(bookingNumber);
    if (existing) return existing;
    const created: ExtraTotals = {
      children: 0,
      breakfast: 0,
      fika: 0,
      lateCheckout: false,
      earlyCheckin: false,
      dietary: new Set<string>(),
      notes: [],
      rows: [],
    };
    extras.set(bookingNumber, created);
    return created;
  };

  for (const { row, l } of normalized) {
    const bookingNumber = get(l, "booking no.", "booking no", "bokningsnummer").toUpperCase();
    if (!bookingNumber) continue;
    allRowsByBooking.set(bookingNumber, [...(allRowsByBooking.get(bookingNumber) ?? []), row]);

    const type = get(l, "type", "typ").toUpperCase();
    const specification = get(l, "specification", "kategori");
    const internalNote = get(l, "internal note", "note", "notering");
    const dietaryText = `${specification} ${internalNote}`;
    const extra = getExtras(bookingNumber);
    parseDietary(dietaryText).forEach((id) => extra.dietary.add(id));
    if (internalNote && !extra.notes.includes(internalNote)) extra.notes.push(internalNote);

    if (type === "ACCOMM") {
      accommodationByBooking.set(bookingNumber, [...(accommodationByBooking.get(bookingNumber) ?? []), { row, l }]);
      continue;
    }

    if (type !== "EXTRAS") continue;
    const units = Math.max(1, parseInteger(get(l, "units"), 1));
    const low = specification.toLowerCase();
    extra.rows.push(row);

    if (low.includes("barn")) extra.children += units;
    if (low.includes("frukost")) extra.breakfast += units;
    if (low.includes("fikapåse") || low.includes("fikapase")) extra.fika += units;
    if (low.includes("sen utcheck")) extra.lateCheckout = true;
    if (low.includes("tidig incheck")) extra.earlyCheckin = true;
  }

  const bookings: ParsedBooking[] = [];
  const stays: ParsedTentStay[] = [];
  let breakfastPortions = 0;
  let fikaBags = 0;

  for (const [bookingNumber, accommodationRows] of accommodationByBooking.entries()) {
    const sorted = [...accommodationRows].sort((a, b) => {
      const aRoom = parseInteger(get(a.l, "room id", "room"), 99);
      const bRoom = parseInteger(get(b.l, "room id", "room"), 99);
      return aRoom - bRoom;
    });
    const extra = getExtras(bookingNumber);
    const contact = contacts.get(bookingNumber);
    // Booking.com/basic-info may carry children only in the internal note.
    // Use the larger value, never add both sources, to avoid double counting.
    extra.children = Math.max(extra.children, contact?.children_total ?? 0);
    const firstRow = sorted[0]?.l;
    if (!firstRow) continue;

    const first = get(firstRow, "first name", "förnamn");
    const last = get(firstRow, "last name", "efternamn");
    const guestName = fullName(first, last, get(firstRow, "guest name", "namn"));
    const checkin = parseDateOnly(get(firstRow, "check-in", "checkin", "incheckning"));
    const checkout = parseDateOnly(get(firstRow, "check-out", "checkout", "utcheckning"));
    if (!checkin || !checkout) {
      warnings.push(`Bokning ${bookingNumber} saknar giltigt in- eller utcheckningsdatum.`);
      continue;
    }

    const tentIds: string[] = [];
    let amount = 0;
    for (const rawRow of allRowsByBooking.get(bookingNumber) ?? []) {
      const l = lookupRow(rawRow);
      const type = get(l, "type", "typ").toUpperCase();
      if (type === "PAYMENT") continue;
      const rowTotal = parseNumber(get(l, "total", "belopp"));
      if (rowTotal && rowTotal > 0) amount += rowTotal;
    }

    sorted.forEach(({ row, l }, index) => {
      const roomId = get(l, "room id", "room") || null;
      const specification = get(l, "specification", "kategori");
      const tent = detectTent(roomId ?? "", specification);
      if (!tent) {
        warnings.push(`Bokning ${bookingNumber}: kunde inte koppla “${specification || roomId}” till ett tält.`);
        return;
      }

      tentIds.push(tent.id);
      const adults = parseInteger(get(l, "guests"), 0);
      // Sirvoy exporterar barn som ett bokningsgemensamt tillval utan rumsfördelning.
      // För att barn inte ska räknas en gång per tält läggs de på första tältet.
      const children = index === 0 ? extra.children : 0;
      const breakfastCsvQuantity = index === 0 ? extra.breakfast : 0;
      const fikaCsvQuantity = index === 0 ? extra.fika : 0;
      const rowGuestName = fullName(
        get(l, "first name", "förnamn"),
        get(l, "last name", "efternamn"),
        get(l, "guest name", "namn"),
      ) ?? guestName;
      const noteParts = [get(l, "internal note", "note"), ...extra.notes].filter(Boolean);

      stays.push({
        booking_number: bookingNumber,
        room_id: roomId,
        tent_id: tent.id,
        checkin_date: checkin,
        checkout_date: checkout,
        adults,
        children,
        guests: adults + children,
        breakfast: breakfastCsvQuantity > 0,
        fikapase: fikaCsvQuantity > 0,
        late_checkout: extra.lateCheckout,
        late_checkout_csv: extra.lateCheckout,
        breakfast_csv_quantity: breakfastCsvQuantity,
        breakfast_addon_quantity: 0,
        fikapase_csv_quantity: fikaCsvQuantity,
        fikapase_addon_quantity: 0,
        guest_name: rowGuestName,
        phone: contact?.phone ?? null,
        email: contact?.email ?? null,
        lang: contact?.lang ?? "sv",
        note: Array.from(new Set(noteParts)).join("\n") || null,
        dietary: Array.from(extra.dietary),
        dietary_note: extra.notes.join("\n") || null,
        import_source: "sirvoy_booking_content",
        imported_at: new Date().toISOString(),
        raw: {
          accommodation: row,
          extras: extra.rows,
          child_allocation: index === 0 && extra.children > 0 ? "booking children assigned to first tent because Sirvoy has no room allocation" : null,
        },
      });
    });

    const firstTent = sorted
      .map(({ l }) => detectTent(get(l, "room id", "room"), get(l, "specification", "kategori")))
      .find(Boolean) ?? null;

    bookings.push({
      booking_number: bookingNumber,
      sirvoy_booking_no: bookingNumber,
      guest_name: contact?.guest_name ?? guestName,
      guest_first_name: contact?.guest_first_name ?? (first || null),
      email: contact?.email,
      phone: contact?.phone,
      address: contact?.address,
      country_code: contact?.country_code,
      checkin_date: checkin,
      checkout_date: checkout,
      tent_id: firstTent?.id ?? null,
      tent_name: firstTent?.name ?? null,
      amount: amount || null,
      lang: contact?.lang ?? "sv",
      language: contact?.language ?? contact?.lang ?? "sv",
      nights: nightsBetween(checkin, checkout),
      raw: {
        booking_content: allRowsByBooking.get(bookingNumber) ?? [],
        tent_ids: tentIds,
        breakfast_csv_quantity: extra.breakfast,
        fikapase_csv_quantity: extra.fika,
        children_total: extra.children,
      },
    });

    breakfastPortions += extra.breakfast;
    fikaBags += extra.fika;
  }

  return {
    bookings,
    stays,
    bookingNumbers: bookings.map((booking) => booking.booking_number),
    breakfastPortions,
    fikaBags,
    warnings,
  };
}
