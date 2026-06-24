import { describe, it, expect } from "vitest";
import {
  buildAddonFlagsByStay,
  buildTentStayPatchFromAddonSlugs,
  mergeStayWithAddonPatch,
} from "../stay-sync";

describe("stay-sync: addon → tent_stays (forward)", () => {
  it("sets breakfast flag when slug is breakfast", () => {
    expect(buildTentStayPatchFromAddonSlugs(["breakfast"])).toEqual({ breakfast: true });
  });

  it("sets fikapase flag when slug is fika_bag", () => {
    expect(buildTentStayPatchFromAddonSlugs(["fika_bag"])).toEqual({ fikapase: true });
  });

  it("sets both when both slugs present", () => {
    expect(buildTentStayPatchFromAddonSlugs(["breakfast", "fika_bag"])).toEqual({
      breakfast: true,
      fikapase: true,
    });
  });

  it("ignores unknown slugs (e.g. early_checkin)", () => {
    expect(buildTentStayPatchFromAddonSlugs(["early_checkin"])).toEqual({});
  });

  it("never produces a false value — only sets true (so CSV import cannot be cleared)", () => {
    const patch = buildTentStayPatchFromAddonSlugs(["breakfast"]);
    expect(patch.breakfast).toBe(true);
    expect(patch.fikapase).toBeUndefined();
  });
});

describe("stay-sync: addon re-apply after Sirvoy re-import", () => {
  const bookings = [
    { id: "b1", booking_number: "26393", tent_id: "naturkarnan" },
    { id: "b2", booking_number: "TN22TY37QA", tent_id: "naturkarnan" },
  ];

  it("re-applies paid breakfast + fika_bag orders to the right stay", () => {
    const orders = [
      { booking_id: "b2", status: "paid", addons: { slug: "breakfast" } },
      { booking_id: "b2", status: "paid", addons: { slug: "fika_bag" } },
    ];
    const map = buildAddonFlagsByStay(orders, bookings);
    expect(map.get("TN22TY37QA|naturkarnan")).toEqual({ breakfast: true, fikapase: true });
    expect(map.has("26393|naturkarnan")).toBe(false);
  });

  it("skips cancelled / refunded orders", () => {
    const orders = [
      { booking_id: "b2", status: "cancelled", addons: { slug: "breakfast" } },
      { booking_id: "b2", status: "refunded", addons: { slug: "fika_bag" } },
    ];
    expect(buildAddonFlagsByStay(orders, bookings).size).toBe(0);
  });

  it("includes confirmed and requested statuses", () => {
    const orders = [
      { booking_id: "b1", status: "confirmed", addons: { slug: "breakfast" } },
      { booking_id: "b2", status: "requested", addons: { slug: "fika_bag" } },
    ];
    const map = buildAddonFlagsByStay(orders, bookings);
    expect(map.get("26393|naturkarnan")).toEqual({ breakfast: true });
    expect(map.get("TN22TY37QA|naturkarnan")).toEqual({ fikapase: true });
  });

  it("ignores orders whose booking_id is not in the imported set", () => {
    const orders = [{ booking_id: "ghost", status: "paid", addons: { slug: "breakfast" } }];
    expect(buildAddonFlagsByStay(orders, bookings).size).toBe(0);
  });

  it("ignores non-breakfast/fika addons (e.g. early_checkin)", () => {
    const orders = [{ booking_id: "b1", status: "paid", addons: { slug: "early_checkin" } }];
    expect(buildAddonFlagsByStay(orders, bookings).size).toBe(0);
  });
});

describe("stay-sync: merge — neither side overwrites the other", () => {
  it("CSV true + addon undefined → stays true", () => {
    const merged = mergeStayWithAddonPatch({ breakfast: true, fikapase: false }, undefined);
    expect(merged).toEqual({ breakfast: true, fikapase: false });
  });

  it("CSV false + addon true → becomes true (addon wins upward)", () => {
    const merged = mergeStayWithAddonPatch(
      { breakfast: false, fikapase: false },
      { breakfast: true },
    );
    expect(merged.breakfast).toBe(true);
    expect(merged.fikapase).toBe(false);
  });

  it("CSV true + addon undefined slug → stays true (addon cannot clear)", () => {
    const merged = mergeStayWithAddonPatch({ breakfast: true, fikapase: true }, { breakfast: true });
    expect(merged).toEqual({ breakfast: true, fikapase: true });
  });

  it("both true → true (idempotent)", () => {
    const merged = mergeStayWithAddonPatch(
      { breakfast: true, fikapase: true },
      { breakfast: true, fikapase: true },
    );
    expect(merged).toEqual({ breakfast: true, fikapase: true });
  });

  it("preserves extra fields on the stay row", () => {
    const stay = { breakfast: false, fikapase: false, booking_number: "26393", tent_id: "naturkarnan" };
    const merged = mergeStayWithAddonPatch(stay, { fikapase: true });
    expect(merged.booking_number).toBe("26393");
    expect(merged.tent_id).toBe("naturkarnan");
    expect(merged.fikapase).toBe(true);
  });
});

describe("stay-sync: full round-trip scenario", () => {
  it("Sirvoy import wipes stays, addon re-apply restores online orders", () => {
    // Setup: gäst har online-beställt frukost (b2). Sirvoy re-import skapar
    // ny tent_stay-rad utan frukost-spec. Re-apply ska sätta breakfast=true igen.
    const csvStay = { booking_number: "TN22TY37QA", tent_id: "naturkarnan", breakfast: false, fikapase: false };
    const bookings = [{ id: "b2", booking_number: "TN22TY37QA", tent_id: "naturkarnan" }];
    const orders = [{ booking_id: "b2", status: "paid", addons: { slug: "breakfast" } }];

    const patches = buildAddonFlagsByStay(orders, bookings);
    const patch = patches.get(`${csvStay.booking_number}|${csvStay.tent_id}`);
    const final = mergeStayWithAddonPatch(csvStay, patch);

    expect(final.breakfast).toBe(true);
    expect(final.fikapase).toBe(false);
  });

  it("CSV says fikapase=true, online addon is breakfast → both stay true", () => {
    const csvStay = { booking_number: "26393", tent_id: "naturkarnan", breakfast: false, fikapase: true };
    const bookings = [{ id: "b1", booking_number: "26393", tent_id: "naturkarnan" }];
    const orders = [{ booking_id: "b1", status: "paid", addons: { slug: "breakfast" } }];

    const patch = buildAddonFlagsByStay(orders, bookings).get("26393|naturkarnan");
    const final = mergeStayWithAddonPatch(csvStay, patch);

    expect(final).toMatchObject({ breakfast: true, fikapase: true });
  });
});
