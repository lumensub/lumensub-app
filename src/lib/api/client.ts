import type { z } from "zod";
import {
  analyticsSummarySchema,
  apiKeyListSchema,
  createdApiKeySchema,
  createdWebhookSchema,
  paymentsSchema,
  planListSchema,
  planSchema,
  revenueSchema,
  subscriptionListSchema,
  webhookListSchema,
} from "./schemas";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** True when the request never reached the server. */
    readonly offline = false,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiClientOptions {
  baseUrl: string;
  /** Returns the merchant API key, if one is set. */
  getApiKey?: () => string | undefined;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Thin typed wrapper around lumensub-backend's /v1 API. Every response is
 * validated, so a backend change shows up as a clear error instead of a
 * blank screen three components later.
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? ((...args) => fetch(...args));
  }

  // ---- public routes (no key) -------------------------------------------

  getPlan(id: string) {
    return this.request(`/v1/public/plans/${encodeURIComponent(id)}`, planSchema);
  }

  listSubscriptionsFor(subscriber: string) {
    return this.request(`/v1/public/subscribers/${encodeURIComponent(subscriber)}/subscriptions`, subscriptionListSchema);
  }

  listPayments(subscriptionId: string) {
    return this.request(`/v1/public/subscriptions/${encodeURIComponent(subscriptionId)}/payments`, paymentsSchema);
  }

  // ---- merchant routes ---------------------------------------------------

  listPlans() {
    return this.request("/v1/plans", planListSchema, { auth: true });
  }

  /** Plans are created on chain; the backend only stores a display name next to them. */
  setPlanName(id: string, name: string | null) {
    return this.request(`/v1/plans/${encodeURIComponent(id)}`, planSchema, { auth: true, method: "PATCH", body: { name } });
  }

  /** The first page (up to 200) of the merchant's subscriptions, newest first. */
  listMerchantSubscriptions() {
    return this.request("/v1/subscriptions?limit=200", subscriptionListSchema, { auth: true });
  }

  getAnalyticsSummary() {
    return this.request("/v1/analytics/summary", analyticsSummarySchema, { auth: true });
  }

  getRevenue(days = 30) {
    return this.request(`/v1/analytics/revenue?days=${days}`, revenueSchema, { auth: true });
  }

  listWebhooks() {
    return this.request("/v1/webhook-endpoints", webhookListSchema, { auth: true });
  }

  createWebhook(body: { url: string; events: string[] }) {
    return this.request("/v1/webhook-endpoints", createdWebhookSchema, { auth: true, method: "POST", body });
  }

  /** The backend disables the endpoint rather than deleting it, so its delivery history stays. */
  deleteWebhook(id: string) {
    return this.request(`/v1/webhook-endpoints/${encodeURIComponent(id)}`, null, { auth: true, method: "DELETE" });
  }

  listApiKeys() {
    return this.request("/v1/api-keys", apiKeyListSchema, { auth: true });
  }

  createApiKey(body: { name: string }) {
    return this.request("/v1/api-keys", createdApiKeySchema, { auth: true, method: "POST", body });
  }

  deleteApiKey(id: string) {
    return this.request(`/v1/api-keys/${encodeURIComponent(id)}`, null, { auth: true, method: "DELETE" });
  }

  // ---- internals ---------------------------------------------------------

  private async request<T>(
    path: string,
    schema: z.ZodType<T, z.ZodTypeDef, unknown>,
    init?: { auth?: boolean; method?: string; body?: unknown },
  ): Promise<T>;
  private async request(
    path: string,
    schema: null,
    init?: { auth?: boolean; method?: string; body?: unknown },
  ): Promise<void>;
  private async request<T>(
    path: string,
    schema: z.ZodType<T, z.ZodTypeDef, unknown> | null,
    init: { auth?: boolean; method?: string; body?: unknown } = {},
  ): Promise<T | void> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    if (init.auth) {
      const key = this.options.getApiKey?.();
      if (!key) throw new ApiError("Add an API key to load merchant data", 401);
      headers.Authorization = `Bearer ${key}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 10_000);
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: init.method ?? "GET",
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: controller.signal,
      });
    } catch {
      throw new ApiError("Can't reach the LumenSub API", 0, true);
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      try {
        // lumensub-backend errors look like { error: { code, message, details? } }.
        const body = (await response.json()) as { error?: { message?: string } };
        message = body.error?.message ?? message;
      } catch {
        // keep the generic message
      }
      throw new ApiError(message, response.status);
    }

    if (schema === null || response.status === 204) return;
    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) {
      throw new ApiError(`Unexpected response from ${path}`, response.status);
    }
    return parsed.data;
  }
}
