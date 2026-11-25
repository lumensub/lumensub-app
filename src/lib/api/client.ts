import { z } from "zod";
import {
  analyticsSummarySchema,
  apiKeySchema,
  chargeSchema,
  createdApiKeySchema,
  createdWebhookSchema,
  planSchema,
  revenuePointSchema,
  subscriptionSchema,
  webhookSchema,
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

  // ---- public routes -----------------------------------------------------

  getPlan(id: string) {
    return this.request(`/v1/plans/${encodeURIComponent(id)}`, planSchema);
  }

  listSubscriptionsFor(subscriber: string) {
    return this.request(`/v1/subscriptions?subscriber=${encodeURIComponent(subscriber)}`, z.array(subscriptionSchema));
  }

  listCharges(subscriptionId: string) {
    return this.request(`/v1/charges?subscriptionId=${encodeURIComponent(subscriptionId)}`, z.array(chargeSchema));
  }

  // ---- merchant routes ---------------------------------------------------

  listPlans() {
    return this.request("/v1/plans", z.array(planSchema), { auth: true });
  }

  savePlanMetadata(body: { id: string; name: string; description?: string }) {
    return this.request("/v1/plans", planSchema, { auth: true, method: "POST", body });
  }

  listMerchantSubscriptions() {
    return this.request("/v1/merchants/me/subscriptions", z.array(subscriptionSchema), { auth: true });
  }

  getAnalyticsSummary() {
    return this.request("/v1/analytics/summary", analyticsSummarySchema, { auth: true });
  }

  getRevenue(days = 30) {
    return this.request(`/v1/analytics/revenue?days=${days}`, z.array(revenuePointSchema), { auth: true });
  }

  listWebhooks() {
    return this.request("/v1/webhooks", z.array(webhookSchema), { auth: true });
  }

  createWebhook(body: { url: string; events: string[] }) {
    return this.request("/v1/webhooks", createdWebhookSchema, { auth: true, method: "POST", body });
  }

  deleteWebhook(id: string) {
    return this.request(`/v1/webhooks/${encodeURIComponent(id)}`, null, { auth: true, method: "DELETE" });
  }

  listApiKeys() {
    return this.request("/v1/api-keys", z.array(apiKeySchema), { auth: true });
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
        const body = (await response.json()) as { message?: string; error?: string };
        message = body.message ?? body.error ?? message;
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
