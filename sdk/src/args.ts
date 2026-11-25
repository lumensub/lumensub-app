import { Address, nativeToScVal, xdr } from "@stellar/stellar-sdk";
import type { CreatePlanParams } from "./types";

/**
 * Argument encoders for each contract method. They are split out from the
 * client so they can be unit tested without a network, and so the order and
 * integer widths live in exactly one place.
 */

export const address = (value: string): xdr.ScVal => new Address(value).toScVal();
export const i128 = (value: bigint): xdr.ScVal => nativeToScVal(value, { type: "i128" });
export const u64 = (value: bigint | number): xdr.ScVal => nativeToScVal(BigInt(value), { type: "u64" });
export const u32 = (value: number): xdr.ScVal => nativeToScVal(value, { type: "u32" });
export const bool = (value: boolean): xdr.ScVal => nativeToScVal(value, { type: "bool" });

export function createPlanArgs(merchant: string, params: CreatePlanParams): xdr.ScVal[] {
  if (params.amount <= 0n) throw new Error("Plan amount must be greater than zero");
  if (params.periodSecs <= 0n) throw new Error("Billing period must be greater than zero");
  return [
    address(merchant),
    address(params.token),
    i128(params.amount),
    u64(params.periodSecs),
    u64(params.trialSecs ?? 0n),
    u32(params.maxCycles ?? 0),
    u64(params.graceSecs ?? 0n),
  ];
}

export const setPlanActiveArgs = (merchant: string, planId: bigint, active: boolean) => [
  address(merchant),
  u64(planId),
  bool(active),
];

export const subscribeArgs = (subscriber: string, planId: bigint) => [address(subscriber), u64(planId)];

/** pause, resume and cancel all take (subscriber, sub_id). */
export const subscriberActionArgs = (subscriber: string, subId: bigint) => [address(subscriber), u64(subId)];

export const changePlanArgs = (subscriber: string, subId: bigint, newPlanId: bigint) => [
  address(subscriber),
  u64(subId),
  u64(newPlanId),
];

export const chargeArgs = (keeper: string, subId: bigint) => [address(keeper), u64(subId)];

export const refundArgs = (merchant: string, subId: bigint, amount: bigint) => [
  address(merchant),
  u64(subId),
  i128(amount),
];

/** Standard SEP-41 token approve(from, spender, amount, expiration_ledger). */
export const approveArgs = (from: string, spender: string, amount: bigint, expirationLedger: number) => [
  address(from),
  address(spender),
  i128(amount),
  u32(expirationLedger),
];
