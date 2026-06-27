import { describe, expect, it } from "vitest";
import { pickPreparationStay, towelCounts, towelInstruction } from "./cleaning-operations";

const future = [
  { booking_number: "LATE", tent_id: "sjobris", checkin_date: "2026-07-05", checkout_date: "2026-07-06", guests: 4, children: 0 },
  { booking_number: "NEXT", tent_id: "sjobris", checkin_date: "2026-07-02", checkout_date: "2026-07-03", guests: 2, children: 0 },
];

describe("cleaning operations", () => {
  it("cleans on checkout day but prepares towels for the next booking", () => {
    const stay = pickPreparationStay(undefined, future, "sjobris", "2026-06-28");
    expect(stay?.booking_number).toBe("NEXT");
    expect(towelCounts(stay?.guests)).toEqual({ large: 2, small: 2 });
  });

  it("prefers an arrival on the same day", () => {
    const sameDay = { booking_number: "TODAY", tent_id: "sjobris", checkin_date: "2026-06-28", checkout_date: "2026-06-29", guests: 3, children: 1 };
    expect(pickPreparationStay(sameDay, future, "sjobris", "2026-06-28")?.booking_number).toBe("TODAY");
  });

  it("writes the exact Swedish towel instruction", () => {
    expect(towelInstruction(2, "sv")).toBe("Lägg in 2 stora och 2 små handdukar");
  });
});
