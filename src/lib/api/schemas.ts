import { SUBSCRIPTION_STATUSES } from "@lumensub/sdk";
import { z } from "zod";

/**
 * Response shapes for lumensub-backend. Token amounts travel as decimal
 * strings of base units because JSON numbers can't hold i128 safely.
 */

const amount = z.string().regex(/^-?\d+$/, "expected an integer string");
const timestamp = z.string();

export const planSchema = z.object({
  id: z.string(),
  merchant: z.string(),
  token: z.string(),
  tokenCode: z.string().optional(),
  amount,
  periodSecs: z.number(),
  trialSecs: z.number().default(0),
  maxCycles: z.number().default(0),
  graceSecs: z.number().default(0),
  active: z.boolean(),
  name: z.string().optional(),
  description: z.string().optional(),
});

export const subscriptionSchema = z.object({
  id: z.string(),
  planId: z.string(),
  subscriber: z.string(),
  status: z.enum(SUBSCRIPTION_STATUSES),
  nextChargeAt: timestamp.nullable(),
  cyclesCharged: z.number(),
  createdAt: timestamp,
  plan: planSchema.optional(),
});

export const analyticsSummarySchema = z.object({
  mrr: amount,
  activeSubscriptions: z.number(),
  churnRate: z.number(),
  revenueByPlan: z.array(z.object({ planId: z.string(), name: z.string().optional(), revenue: amount })),
});

export const revenuePointSchema = z.object({ date: z.string(), revenue: amount });

export const webhookSchema = z.object({
  id: z.string(),
  url: z.string(),
  events: z.array(z.string()),
  active: z.boolean().default(true),
  createdAt: timestamp,
});

export const createdWebhookSchema = z.object({ webhook: webhookSchema, secret: z.string() });

export const apiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  prefix: z.string(),
  createdAt: timestamp,
  lastUsedAt: timestamp.nullable().optional(),
});

export const createdApiKeySchema = z.object({ apiKey: apiKeySchema, key: z.string() });

export const chargeSchema = z.object({
  id: z.string(),
  subscriptionId: z.string(),
  amount,
  status: z.enum(["succeeded", "failed", "refunded"]),
  txHash: z.string().nullable().optional(),
  createdAt: timestamp,
});

export type PlanDto = z.infer<typeof planSchema>;
export type SubscriptionDto = z.infer<typeof subscriptionSchema>;
export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>;
export type RevenuePoint = z.infer<typeof revenuePointSchema>;
export type Webhook = z.infer<typeof webhookSchema>;
export type ApiKey = z.infer<typeof apiKeySchema>;
export type Charge = z.infer<typeof chargeSchema>;

export const WEBHOOK_EVENTS = [
  "subscription.created",
  "subscription.paused",
  "subscription.resumed",
  "subscription.cancelled",
  "charge.succeeded",
  "charge.failed",
  "refund.created",
] as const;
