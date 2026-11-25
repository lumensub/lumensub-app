import type { SubscriptionStatus } from "@lumensub/sdk";
import { z } from "zod";

/**
 * Response shapes for lumensub-backend, and the conversion into what the UI
 * uses. The backend returns database rows as they are: snake_case keys, token
 * amounts and 64-bit integers as decimal strings (JSON numbers can't hold them
 * safely), 32-bit integers as numbers and timestamps as ISO strings. Each
 * schema validates that and turns it into a camelCase object, so components
 * never see the wire format.
 */

const amount = z.string().regex(/^-?\d+$/, "expected an integer string");
const int64 = z.union([z.string().regex(/^\d+$/), z.number().int()]).transform((v) => Number(v));
const timestamp = z.string();

/** The backend stores statuses in snake_case; the SDK and UI use the contract's variant names. */
const STATUS_FROM_API: Record<string, SubscriptionStatus> = {
  trialing: "Trialing",
  active: "Active",
  past_due: "PastDue",
  paused: "Paused",
  cancelled: "Cancelled",
  lapsed: "Lapsed",
  completed: "Completed",
};
const status = z
  .string()
  .refine((s) => s in STATUS_FROM_API, "unknown status")
  .transform((s) => STATUS_FROM_API[s]);

/** `{ data: [...] }`, optionally with a `next_cursor`. Only the rows are kept. */
const list = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ data: z.array(item), next_cursor: z.string().nullable().optional() }).transform((r) => r.data);

// ---- plans -----------------------------------------------------------------

/**
 * One shape for both plan routes. The public route (checkout) adds the merchant's
 * address and display name; the merchant route adds grace period and counts.
 */
export const planSchema = z
  .object({
    id: z.string(),
    token: z.string(),
    amount,
    period_secs: int64,
    trial_secs: int64.default(0),
    max_cycles: z.number().int().default(0),
    grace_secs: int64.default(0),
    active: z.boolean(),
    name: z.string().nullable().optional(),
    merchant_address: z.string().optional(),
    merchant_name: z.string().nullable().optional(),
    live_subscriptions: int64.optional(),
  })
  .transform((p) => ({
    id: p.id,
    merchant: p.merchant_address ?? "",
    merchantName: p.merchant_name ?? undefined,
    token: p.token,
    /** Not stored by the backend yet; the UI falls back to a shortened contract id. */
    tokenCode: undefined as string | undefined,
    amount: p.amount,
    periodSecs: p.period_secs,
    trialSecs: p.trial_secs,
    maxCycles: p.max_cycles,
    graceSecs: p.grace_secs,
    active: p.active,
    name: p.name ?? undefined,
    /** Not stored by the backend; kept so the checkout can show one later. */
    description: undefined as string | undefined,
    liveSubscriptions: p.live_subscriptions,
  }));

export const planListSchema = list(planSchema);

// ---- subscriptions ---------------------------------------------------------

/**
 * The merchant route returns the subscriber; the subscriber route (portal)
 * leaves it out but joins in the plan's price and the merchant's name.
 */
export const subscriptionSchema = z
  .object({
    id: z.string(),
    plan_id: z.string(),
    subscriber: z.string().optional(),
    status,
    cycles_charged: z.number().int(),
    next_charge_at: timestamp.nullable(),
    created_at: timestamp,
    token: z.string().optional(),
    amount: amount.optional(),
    period_secs: int64.optional(),
    plan_name: z.string().nullable().optional(),
    merchant_address: z.string().optional(),
    merchant_name: z.string().nullable().optional(),
  })
  .transform((s) => ({
    id: s.id,
    planId: s.plan_id,
    subscriber: s.subscriber ?? "",
    status: s.status,
    nextChargeAt: s.next_charge_at,
    cyclesCharged: s.cycles_charged,
    createdAt: s.created_at,
    plan:
      s.token !== undefined && s.amount !== undefined
        ? {
            name: s.plan_name ?? undefined,
            token: s.token,
            tokenCode: undefined as string | undefined,
            amount: s.amount,
            periodSecs: s.period_secs ?? 0,
            merchant: s.merchant_address ?? "",
            merchantName: s.merchant_name ?? undefined,
          }
        : undefined,
  }));

export const subscriptionListSchema = list(subscriptionSchema);

// ---- payments (receipts) ---------------------------------------------------

/** Charges, failed charges and refunds of one subscription, merged into one list, newest first. */
export const paymentsSchema = z
  .object({
    charges: z.array(z.object({ id: z.string(), cycle: z.number().int(), amount, tx_hash: z.string().nullable(), charged_at: timestamp })),
    failures: z.array(z.object({ id: z.string(), reason: z.string(), failed_at: timestamp })),
    refunds: z.array(z.object({ id: z.string(), amount, refunded_at: timestamp })),
  })
  .transform((r) =>
    [
      ...r.charges.map((c) => ({
        id: `charge-${c.id}`,
        kind: "charge" as const,
        amount: c.amount as string | null,
        detail: `Cycle ${c.cycle}`,
        txHash: c.tx_hash,
        at: c.charged_at,
      })),
      ...r.failures.map((f) => ({
        id: `failure-${f.id}`,
        kind: "failed" as const,
        amount: null as string | null,
        detail: f.reason === "allowance" ? "Allowance too low" : f.reason === "balance" ? "Balance too low" : f.reason,
        txHash: null as string | null,
        at: f.failed_at,
      })),
      ...r.refunds.map((x) => ({
        id: `refund-${x.id}`,
        kind: "refund" as const,
        amount: x.amount as string | null,
        detail: "Refund",
        txHash: null as string | null,
        at: x.refunded_at,
      })),
    ].sort((a, b) => b.at.localeCompare(a.at)),
  );

// ---- analytics -------------------------------------------------------------

const LIVE_STATUSES = ["trialing", "active", "past_due"];

export const analyticsSummarySchema = z
  .object({
    mrr: z.record(amount),
    subscriptions: z.record(z.number()),
    churn30d: z.number(),
    revenue30d: z.array(z.object({ plan_id: z.string(), token: z.string(), charges: z.number(), gross: amount, fees: amount })),
  })
  .transform((s) => ({
    /** MRR per token contract id. Plans in different tokens can't be added up. */
    mrrByToken: s.mrr,
    activeSubscriptions: LIVE_STATUSES.reduce((sum, key) => sum + (s.subscriptions[key] ?? 0), 0),
    churnRate: s.churn30d,
    revenueByPlan: s.revenue30d.map((r) => ({ planId: r.plan_id, token: r.token, revenue: r.gross, charges: r.charges })),
  }));

export const revenueSchema = list(
  z.object({ date: z.string(), token: z.string(), charges: z.number(), gross: amount }),
).transform((rows) => rows.map((r) => ({ date: r.date, token: r.token, revenue: r.gross })));

// ---- webhooks --------------------------------------------------------------

const webhookRow = z
  .object({
    id: z.string(),
    url: z.string(),
    events: z.array(z.string()),
    active: z.boolean(),
    created_at: timestamp,
  })
  .transform((w) => ({ id: w.id, url: w.url, events: w.events, active: w.active, createdAt: w.created_at }));

export const webhookListSchema = list(webhookRow);

/** The create response is the endpoint plus its signing secret, shown only once. */
export const createdWebhookSchema = z
  .object({ secret: z.string() })
  .passthrough()
  .transform((body) => ({ webhook: webhookRow.parse(body), secret: body.secret }));

// ---- API keys --------------------------------------------------------------

const apiKeyRow = z
  .object({
    id: z.string(),
    name: z.string(),
    key_prefix: z.string(),
    created_at: timestamp,
    last_used_at: timestamp.nullable().optional(),
  })
  .transform((k) => ({ id: k.id, name: k.name, prefix: k.key_prefix, createdAt: k.created_at, lastUsedAt: k.last_used_at ?? null }));

export const apiKeyListSchema = list(apiKeyRow);

/** The create response has the full key, which is never shown again, and no timestamps. */
export const createdApiKeySchema = z
  .object({ id: z.string(), name: z.string(), key: z.string(), key_prefix: z.string() })
  .transform((k) => ({
    apiKey: { id: k.id, name: k.name, prefix: k.key_prefix, createdAt: new Date().toISOString(), lastUsedAt: null },
    key: k.key,
  }));

// ---- types -----------------------------------------------------------------

export type PlanDto = z.output<typeof planSchema>;
export type SubscriptionDto = z.output<typeof subscriptionSchema>;
export type Payment = z.output<typeof paymentsSchema>[number];
export type AnalyticsSummary = z.output<typeof analyticsSummarySchema>;
export type RevenuePoint = z.output<typeof revenueSchema>[number];
export type Webhook = z.output<typeof webhookRow>;
export type ApiKey = z.output<typeof apiKeyRow>;

/** Event types the backend can deliver. An endpoint with none selected gets all of them. */
export const WEBHOOK_EVENTS = [
  "merchant.updated",
  "plan.created",
  "plan.updated",
  "subscription.created",
  "subscription.charged",
  "subscription.charge_failed",
  "subscription.paused",
  "subscription.resumed",
  "subscription.cancelled",
  "subscription.plan_changed",
  "subscription.refunded",
] as const;
