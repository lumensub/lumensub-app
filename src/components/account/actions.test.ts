import { describe, expect, it } from "vitest";
import { availableActions } from "./actions";

describe("availableActions", () => {
  it("lets running subscriptions pause, change plan or cancel", () => {
    expect(availableActions("Active")).toEqual(["pause", "change", "cancel"]);
    expect(availableActions("Trialing")).toEqual(["pause", "change", "cancel"]);
  });

  it("only offers resume and cancel while paused", () => {
    expect(availableActions("Paused")).toEqual(["resume", "cancel"]);
  });

  it("offers nothing once a subscription has ended", () => {
    for (const status of ["Cancelled", "Lapsed", "Completed"] as const) {
      expect(availableActions(status)).toEqual([]);
    }
  });
});
