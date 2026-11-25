import { describe, expect, it } from "vitest";
import { approvalFor, DEFAULT_APPROVAL_CYCLES } from "./approval";

describe("approvalFor", () => {
  it("approves exactly the total of a fixed-length plan", () => {
    expect(approvalFor(50n, 6)).toEqual({ cycles: 6, total: 300n });
  });

  it("caps open-ended plans at the default number of payments", () => {
    expect(approvalFor(10n, 0)).toEqual({ cycles: DEFAULT_APPROVAL_CYCLES, total: 10n * BigInt(DEFAULT_APPROVAL_CYCLES) });
  });
});
