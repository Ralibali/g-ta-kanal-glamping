import { describe, expect, it } from "vitest";
import { detectSirvoyFile, mergeDietaryIntoStays, normalizePhone, parseBasicInfo, parseBookingContent, type ParsedTentStay } from "./sirvoy-import";

describe("Sirvoy import", () => {
  it("recognises both export formats", () => {
    expect(detectSirvoyFile(["Type", "Booking no.", "Specification", "Room ID", "Units"])).toBe("booking_content");
    expect(detectSirvoyFile(["Booking date", "Booking no.", "Phone", "Email", "Number of guests"])).toBe("basic_info");
  });

  it("normalises Sirvoy phone numbers without losing country code", () => {
    expect(normalizePhone("'+12025550123")).toBe("+12025550123");
    expect(normalizePhone("070-000 00 00")).toBe("+46700000000");
    expect(normalizePhone("0049 151 00000000")).toBe("+4915100000000");
    expect(normalizePhone("")).toBeNull();
  });

  it("uses Units for breakfast instead of multiplying by tent rows", () => {
    const basic = parseBasicInfo([{ "Booking no.": "B1", "First name": "Test", "Last name": "Guest", Phone: "", Email: "", "Number of guests": "4", Language: "sv" }]);
    const parsed = parseBookingContent([
      { Type: "ACCOMM", "Booking no.": "B1", "Check-in": "2026-06-26", "Check-out": "2026-06-27", Specification: "Tält 2 - Naturkärnan", "Room ID": "2", Guests: "2" },
      { Type: "ACCOMM", "Booking no.": "B1", "Check-in": "2026-06-26", "Check-out": "2026-06-27", Specification: "Tält 3 - Lugnets yta", "Room ID": "3", Guests: "2" },
      { Type: "EXTRAS", "Booking no.": "B1", "Check-in": "2026-06-26", "Check-out": "2026-06-27", Specification: "Frukost från lokalt bageri", Units: "4" },
    ], basic.contacts);

    expect(parsed.breakfastPortions).toBe(4);
    expect(parsed.stays).toHaveLength(2);
    expect(parsed.stays.reduce((sum, stay) => sum + stay.breakfast_csv_quantity, 0)).toBe(4);
    expect(parsed.stays.filter((stay) => stay.breakfast_csv_quantity > 0)).toHaveLength(1);
  });

  it("does not duplicate booking-level children across several tents", () => {
    const basic = parseBasicInfo([{ "Booking no.": "B2", "Internal note": "This booking includes 2 child(ren): 1 age 5 1 age 7", "Number of guests": "2", Phone: "", Email: "" }]);
    const parsed = parseBookingContent([
      { Type: "ACCOMM", "Booking no.": "B2", "Check-in": "2026-07-01", "Check-out": "2026-07-02", Specification: "Tält 1", "Room ID": "1", Guests: "1" },
      { Type: "ACCOMM", "Booking no.": "B2", "Check-in": "2026-07-01", "Check-out": "2026-07-02", Specification: "Tält 3", "Room ID": "3", Guests: "1" },
    ], basic.contacts);

    expect(parsed.stays.reduce((sum, stay) => sum + stay.children, 0)).toBe(2);
    expect(parsed.stays.reduce((sum, stay) => sum + stay.guests, 0)).toBe(4);
  });
});

describe("mergeDietaryIntoStays (webb-specialkost vid om-import)", () => {
  const baseStay = (overrides: Partial<ParsedTentStay>): ParsedTentStay => ({
    booking_number: "B1",
    room_id: "1",
    tent_id: "sjobris",
    checkin_date: "2026-07-20",
    checkout_date: "2026-07-22",
    adults: 2,
    children: 0,
    guests: 2,
    breakfast: false,
    fikapase: false,
    late_checkout: false,
    late_checkout_csv: false,
    breakfast_csv_quantity: 0,
    breakfast_addon_quantity: 0,
    fikapase_csv_quantity: 0,
    fikapase_addon_quantity: 0,
    guest_name: "Test Guest",
    phone: null,
    email: null,
    lang: "sv",
    note: null,
    dietary: [],
    dietary_note: null,
    raw: {},
    import_source: "sirvoy_booking_content",
    imported_at: "2026-07-17T00:00:00Z",
    ...overrides,
  });

  it("bevarar webbvald specialkost som CSV:n saknar", () => {
    const csv = [baseStay({ dietary: [], dietary_note: null })];
    const byStay = new Map([["B1|sjobris", { dietary: ["gluten_free", "vegan"], note: "Nötallergi barn 1" }]]);
    const merged = mergeDietaryIntoStays(csv, byStay, new Map());
    expect(merged[0].dietary).toEqual(["gluten_free", "vegan"]);
    expect(merged[0].dietary_note).toBe("Nötallergi barn 1");
  });

  it("slår ihop webb och CSV utan dubbletter", () => {
    const csv = [baseStay({ dietary: ["vegan"], dietary_note: "Intern notering" })];
    const byStay = new Map([["B1|sjobris", { dietary: ["gluten_free", "vegan"], note: "Webbanteckning" }]]);
    const merged = mergeDietaryIntoStays(csv, byStay, new Map());
    expect(merged[0].dietary).toEqual(["gluten_free", "vegan"]);
    expect(merged[0].dietary_note).toBe("Webbanteckning\nIntern notering");
  });

  it("faller tillbaka på bokningsnivå om tältet bytts i nya filen", () => {
    const csv = [baseStay({ tent_id: "naturkarnan", room_id: "2" })];
    const byBooking = new Map([["B1", { dietary: ["lactose_free"], note: null }]]);
    const merged = mergeDietaryIntoStays(csv, new Map(), byBooking);
    expect(merged[0].dietary).toEqual(["lactose_free"]);
  });

  it("lämnar rader utan sparad kost orörda", () => {
    const csv = [baseStay({ dietary: ["nut_allergy"], dietary_note: "Från CSV" })];
    const merged = mergeDietaryIntoStays(csv, new Map(), new Map());
    expect(merged[0]).toBe(csv[0]);
  });
});
