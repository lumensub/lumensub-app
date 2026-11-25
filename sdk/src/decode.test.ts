import { nativeToScVal, xdr } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";
import { decodePlan, decodeSubscription, parseStatus } from "./decode";

describe("parseStatus", () => {
  it("accepts enum vectors and bare symbols", () => {
    expect(parseStatus(["Active"])).toBe("Active");
    expect(parseStatus("PastDue")).toBe("PastDue");
  });

  it("throws on unknown values", () => {
    expect(() => parseStatus(["Frozen"])).toThrow(/Unknown subscription status/);
    expect(() => parseStatus(undefined)).toThrow();
  });
});

describe("decodePlan", () => {
  it("maps snake_case fields to the Plan shape", () => {
    const plan = decodePlan(4n, {
      merchant: "GMERCHANT",
      token: "CTOKEN",
      amount: 50_000_000n,
      period_secs: 2_592_000n,
      trial_secs: 0n,
      max_cycles: 12,
      grace_secs: 86_400n,
      active: true,
    });
    expect(plan).toEqual({
      id: 4n,
      merchant: "GMERCHANT",
      token: "CTOKEN",
      amount: 50_000_000n,
      periodSecs: 2_592_000n,
      trialSecs: 0n,
      maxCycles: 12,
      graceSecs: 86_400n,
      active: true,
    });
  });
});

describe("decodeSubscription", () => {
  it("decodes from an ScVal map", () => {
    const scv = xdr.ScVal.scvMap([
      new xdr.ScMapEntry({ key: nativeToScVal("created_at", { type: "symbol" }), val: nativeToScVal(100n, { type: "u64" }) }),
      new xdr.ScMapEntry({ key: nativeToScVal("cycles_charged", { type: "symbol" }), val: nativeToScVal(2, { type: "u32" }) }),
      new xdr.ScMapEntry({ key: nativeToScVal("next_charge_at", { type: "symbol" }), val: nativeToScVal(500n, { type: "u64" }) }),
      new xdr.ScMapEntry({ key: nativeToScVal("plan_id", { type: "symbol" }), val: nativeToScVal(3n, { type: "u64" }) }),
      new xdr.ScMapEntry({
        key: nativeToScVal("status", { type: "symbol" }),
        val: xdr.ScVal.scvVec([nativeToScVal("Paused", { type: "symbol" })]),
      }),
      new xdr.ScMapEntry({ key: nativeToScVal("subscriber", { type: "symbol" }), val: nativeToScVal("GSUB", { type: "string" }) }),
    ]);

    expect(decodeSubscription(9n, scv)).toEqual({
      id: 9n,
      planId: 3n,
      subscriber: "GSUB",
      status: "Paused",
      nextChargeAt: 500n,
      cyclesCharged: 2,
      createdAt: 100n,
    });
  });
});
