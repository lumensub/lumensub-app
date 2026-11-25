/**
 * Types mirroring the `subscription` contract. Amounts are kept as bigint in
 * the token's base units (stroops for 7-decimal Stellar assets) so nothing is
 * lost to floating point before it reaches the UI.
 */

export const SUBSCRIPTION_STATUSES = [
  "Trialing",
  "Active",
  "PastDue",
  "Paused",
  "Cancelled",
  "Lapsed",
  "Completed",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export interface Plan {
  id: bigint;
  merchant: string;
  token: string;
  amount: bigint;
  periodSecs: bigint;
  trialSecs: bigint;
  /** 0 means the plan renews until cancelled. */
  maxCycles: number;
  graceSecs: bigint;
  active: boolean;
}

export interface Subscription {
  id: bigint;
  planId: bigint;
  subscriber: string;
  status: SubscriptionStatus;
  /** Unix seconds of the next charge attempt. */
  nextChargeAt: bigint;
  cyclesCharged: number;
  createdAt: bigint;
}

export interface CreatePlanParams {
  token: string;
  amount: bigint;
  periodSecs: bigint;
  trialSecs?: bigint;
  maxCycles?: number;
  graceSecs?: bigint;
}

export interface LumenSubConfig {
  rpcUrl: string;
  networkPassphrase: string;
  contractId: string;
  /** Fee in stroops for the outer transaction before resource fees. */
  baseFee?: string;
  /** Seconds before a built transaction expires. */
  timeoutSecs?: number;
}
