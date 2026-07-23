import { describe, it, expect } from "vitest";
import { computeObBreakdown, isSwedishHoliday, OB_EVENING_RATE, OB_NIGHT_RATE } from "./ob-salary";

// Hjälp: bygg ISO från Stockholm-lokal tid genom att gissa offset (juli=+02, jan=+01)
function local(date: string, offsetHours: number): string {
  return `${date}:00${offsetHours >= 0 ? "+" : "-"}${String(Math.abs(offsetHours)).padStart(2, "0")}:00`;
}

describe("computeObBreakdown", () => {
  it("ingen OB på vardag 08–10 (sommartid)", () => {
    const r = computeObBreakdown([
      { started_at: local("2026-07-14T08:00", 2), ended_at: local("2026-07-14T10:00", 2) },
    ]);
    expect(r.totalHours).toBeCloseTo(2, 1);
    expect(r.eveningObHours).toBeCloseTo(0, 1);
    expect(r.nightObHours).toBeCloseTo(0, 1);
  });

  it("söndag hela dagen ger OB", () => {
    const r = computeObBreakdown([
      { started_at: local("2026-07-19T10:00", 2), ended_at: local("2026-07-19T13:00", 2) },
    ]);
    expect(r.eveningObHours).toBeCloseTo(3, 1);
    expect(r.obEveningAmount).toBeCloseTo(3 * OB_EVENING_RATE, 1);
  });

  it("lördag 15–18 ger 2h OB (efter 16)", () => {
    const r = computeObBreakdown([
      { started_at: local("2026-07-18T15:00", 2), ended_at: local("2026-07-18T18:00", 2) },
    ]);
    expect(r.eveningObHours).toBeCloseTo(2, 1);
  });

  it("natt 00–07 vardag: 1h vanlig OB (efter 20 räknas ej) + 5h natt (01–06) + 1h vanligt (06–07)", () => {
    const r = computeObBreakdown([
      { started_at: local("2026-07-15T00:00", 2), ended_at: local("2026-07-15T07:00", 2) },
    ]);
    expect(r.nightObHours).toBeCloseTo(5, 1);
    expect(r.obNightAmount).toBeCloseTo(5 * OB_NIGHT_RATE, 1);
  });

  it("midsommarafton är röd dag", () => {
    expect(isSwedishHoliday("2026-06-19")).toBe(true);
  });

  it("ignorerar pågående pass utan slut", () => {
    const r = computeObBreakdown([{ started_at: local("2026-07-14T08:00", 2), ended_at: null }]);
    expect(r.totalHours).toBe(0);
  });
});
