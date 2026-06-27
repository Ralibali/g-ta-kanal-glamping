import { describe, expect, it } from "vitest";
import { buildBreakfastOrders, parseExplicitBreakfastDays, planBreakfastDates } from "./breakfast-orders";

describe("breakfast operations", () => {
  it("reads Swedish day words from a guest comment", () => {
    expect(parseExplicitBreakfastDays("2 personer frukost för två dagar")).toBe(2);
  });

  it("keeps six Sirvoy portions as six on a one-night booking", () => {
    expect(planBreakfastDates({
      checkin: "2026-06-26",
      checkout: "2026-06-27",
      totalGuests: 6,
      csvQuantity: 6,
      addonQuantity: 0,
      notes: "",
    })).toEqual([{ date: "2026-06-27", csv: 6, addon: 0, warning: null }]);
  });

  it("splits four portions into two portions on each morning", () => {
    expect(planBreakfastDates({
      checkin: "2026-07-08",
      checkout: "2026-07-10",
      totalGuests: 2,
      csvQuantity: 4,
      addonQuantity: 0,
      notes: "2 personer frukost för två dagar",
    })).toEqual([
      { date: "2026-07-09", csv: 2, addon: 0, warning: null },
      { date: "2026-07-10", csv: 2, addon: 0, warning: null },
    ]);
  });

  it("warns instead of inventing a distribution for an ambiguous order", () => {
    const plan = planBreakfastDates({
      checkin: "2026-07-02",
      checkout: "2026-07-04",
      totalGuests: 4,
      csvQuantity: 3,
      addonQuantity: 0,
      notes: "",
    });
    expect(plan).toHaveLength(1);
    expect(plan[0].date).toBe("2026-07-04");
    expect(plan[0].warning).toContain("kunde inte fördelas säkert");
  });

  it("finds a nut allergy in Basic info comments", () => {
    const orders = buildBreakfastOrders([
      {
        booking_number: "B1",
        tent_id: "naturkarnan",
        checkin_date: "2026-07-19",
        checkout_date: "2026-07-20",
        guests: 2,
        guest_name: "Test Guest",
        dietary: [],
        dietary_note: null,
        breakfast_csv_quantity: 2,
        breakfast_addon_quantity: 0,
        fikapase_csv_quantity: 0,
        fikapase_addon_quantity: 0,
      },
    ], [{
      booking_number: "B1",
      guest_name: "Test Guest",
      raw: { basic_info: { "Guest comment": "Nut allergy for one guest" } },
    }], []);

    expect(orders[0].dietary).toContain("nut_allergy");
    expect(orders[0].dietaryNote).toContain("Nut allergy");
  });
});
