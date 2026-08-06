import { describe, expect, it } from "vitest";
import { findRebookedTents, pickPreparationStay, towelCounts, towelInstruction } from "./cleaning-operations";

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

describe("rebooked tents", () => {
  const stays = [
    { booking_number: "26476", tent_id: "naturkarnan", checkin_date: "2026-08-05", checkout_date: "2026-08-07" },
  ];

  it("flags the tent a guest was moved away from", () => {
    const sessions = [
      { tent_id: "lugnetsyta", cleaning_date: "2026-08-05", status: "completed", arrival_booking: "26476" },
    ];
    expect(findRebookedTents(sessions, stays, "2026-08-06")).toEqual([
      { tent_id: "lugnetsyta", booking_number: "26476", movedTo: "naturkarnan" },
    ]);
  });

  it("ignores tents already cleaned or scheduled today", () => {
    const sessions = [
      { tent_id: "lugnetsyta", cleaning_date: "2026-08-05", status: "completed", arrival_booking: "26476" },
      { tent_id: "lugnetsyta", cleaning_date: "2026-08-06", status: "in_progress", arrival_booking: null },
    ];
    expect(findRebookedTents(sessions, stays, "2026-08-06")).toEqual([]);
  });

  it("ignores bookings that have checked out", () => {
    const sessions = [
      { tent_id: "lugnetsyta", cleaning_date: "2026-08-05", status: "completed", arrival_booking: "26476" },
    ];
    expect(findRebookedTents(sessions, [], "2026-08-06")).toEqual([]);
  });
});
