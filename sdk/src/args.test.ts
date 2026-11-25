import { Keypair, StrKey, scValToNative, xdr } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";
import * as args from "./args";

const merchant = Keypair.random().publicKey();
const subscriber = Keypair.random().publicKey();
const token = StrKey.encodeContract(Buffer.alloc(32, 1));
const contract = StrKey.encodeContract(Buffer.alloc(32, 2));

const kinds = (vals: xdr.ScVal[]) => vals.map((v) => v.switch().name);

describe("createPlanArgs", () => {
  it("encodes every field with the contract's integer widths", () => {
    const vals = args.createPlanArgs(merchant, {
      token,
      amount: 50_000_000n,
      periodSecs: 2_592_000n,
      trialSecs: 604_800n,
      maxCycles: 12,
      graceSecs: 259_200n,
    });

    expect(kinds(vals)).toEqual([
      "scvAddress",
      "scvAddress",
      "scvI128",
      "scvU64",
      "scvU64",
      "scvU32",
      "scvU64",
    ]);
    expect(vals.map((v) => scValToNative(v))).toEqual([
      merchant,
      token,
      50_000_000n,
      2_592_000n,
      604_800n,
      12,
      259_200n,
    ]);
  });

  it("defaults optional fields to zero", () => {
    const vals = args.createPlanArgs(merchant, { token, amount: 1n, periodSecs: 60n });
    expect(vals.slice(4).map((v) => scValToNative(v))).toEqual([0n, 0, 0n]);
  });

  it("refuses a zero amount or period before anything is sent", () => {
    expect(() => args.createPlanArgs(merchant, { token, amount: 0n, periodSecs: 60n })).toThrow(/amount/);
    expect(() => args.createPlanArgs(merchant, { token, amount: 1n, periodSecs: 0n })).toThrow(/period/);
  });
});

describe("subscriber actions", () => {
  it("encodes (subscriber, sub_id)", () => {
    const vals = args.subscriberActionArgs(subscriber, 7n);
    expect(kinds(vals)).toEqual(["scvAddress", "scvU64"]);
    expect(scValToNative(vals[1])).toBe(7n);
  });

  it("encodes change_plan with both ids as u64", () => {
    const vals = args.changePlanArgs(subscriber, 3n, 9n);
    expect(kinds(vals)).toEqual(["scvAddress", "scvU64", "scvU64"]);
    expect(vals.slice(1).map((v) => scValToNative(v))).toEqual([3n, 9n]);
  });
});

describe("approveArgs", () => {
  it("matches the SEP-41 approve signature", () => {
    const vals = args.approveArgs(subscriber, contract, 600_000_000n, 1_234_567);
    expect(kinds(vals)).toEqual(["scvAddress", "scvAddress", "scvI128", "scvU32"]);
    expect(vals.map((v) => scValToNative(v))).toEqual([subscriber, contract, 600_000_000n, 1_234_567]);
  });
});

describe("refundArgs", () => {
  it("encodes the refund amount as i128", () => {
    const vals = args.refundArgs(merchant, 1n, 25n);
    expect(kinds(vals)).toEqual(["scvAddress", "scvU64", "scvI128"]);
  });
});
