import { scValToNative, xdr } from "@stellar/stellar-sdk";
import { SUBSCRIPTION_STATUSES, type Plan, type Subscription, type SubscriptionStatus } from "./types";

type Raw = Record<string, unknown>;

function big(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" || typeof value === "string") return BigInt(value);
  return 0n;
}

/**
 * Unit enum variants come back from `scValToNative` as `["Active"]`; plain
 * symbols come back as `"Active"`. Accept both so a contract change in either
 * direction doesn't break the app.
 */
export function parseStatus(value: unknown): SubscriptionStatus {
  const name = Array.isArray(value) ? value[0] : value;
  if (typeof name === "string" && (SUBSCRIPTION_STATUSES as readonly string[]).includes(name)) {
    return name as SubscriptionStatus;
  }
  throw new Error(`Unknown subscription status: ${JSON.stringify(value)}`);
}

export function decodePlan(id: bigint, value: xdr.ScVal | Raw): Plan {
  const raw = (value instanceof xdr.ScVal ? scValToNative(value) : value) as Raw;
  return {
    id,
    merchant: String(raw.merchant),
    token: String(raw.token),
    amount: big(raw.amount),
    periodSecs: big(raw.period_secs),
    trialSecs: big(raw.trial_secs),
    maxCycles: Number(raw.max_cycles ?? 0),
    graceSecs: big(raw.grace_secs),
    active: Boolean(raw.active),
  };
}

export function decodeSubscription(id: bigint, value: xdr.ScVal | Raw): Subscription {
  const raw = (value instanceof xdr.ScVal ? scValToNative(value) : value) as Raw;
  return {
    id,
    planId: big(raw.plan_id),
    subscriber: String(raw.subscriber),
    status: parseStatus(raw.status),
    nextChargeAt: big(raw.next_charge_at),
    cyclesCharged: Number(raw.cycles_charged ?? 0),
    createdAt: big(raw.created_at),
  };
}
