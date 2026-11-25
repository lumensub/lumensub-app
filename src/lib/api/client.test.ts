import { describe, expect, it, vi } from "vitest";
import { ApiClient, ApiError } from "./client";

// What GET /v1/public/plans/:id returns: database columns, 64-bit integers as strings.
const plan = {
  id: "1",
  token: "CTOKEN",
  amount: "50000000",
  period_secs: "2592000",
  trial_secs: "0",
  max_cycles: 0,
  active: true,
  name: null,
  merchant_address: "GMERCHANT",
  merchant_name: null,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("ApiClient", () => {
  it("reads a public plan from the backend's wire format", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(plan));
    const client = new ApiClient({ baseUrl: "http://api.test/", fetchImpl });

    const result = await client.getPlan("1");

    expect(fetchImpl).toHaveBeenCalledWith("http://api.test/v1/public/plans/1", expect.objectContaining({ method: "GET" }));
    expect(result).toMatchObject({ id: "1", merchant: "GMERCHANT", periodSecs: 2_592_000, trialSecs: 0, graceSecs: 0 });
    expect(result.name).toBeUndefined();
  });

  it("maps a wallet's subscriptions, statuses included", async () => {
    const row = {
      id: "7",
      plan_id: "1",
      status: "past_due",
      cycles_charged: 2,
      next_charge_at: "2026-03-01T00:00:00.000Z",
      created_at: "2026-01-01T00:00:00.000Z",
      token: "CTOKEN",
      amount: "100000000",
      period_secs: "2592000",
      plan_name: "Pro",
      merchant_address: "GMERCHANT",
      merchant_name: null,
    };
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ data: [row] }));
    const client = new ApiClient({ baseUrl: "http://api.test", fetchImpl });

    const [sub] = await client.listSubscriptionsFor("GSUB");

    expect(fetchImpl.mock.calls[0][0]).toBe("http://api.test/v1/public/subscribers/GSUB/subscriptions");
    expect(sub).toMatchObject({ id: "7", planId: "1", status: "PastDue", cyclesCharged: 2 });
    expect(sub.plan).toMatchObject({ name: "Pro", amount: "100000000", periodSecs: 2_592_000, merchant: "GMERCHANT" });
  });

  it("merges charges, failures and refunds into one receipt list, newest first", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        charges: [{ id: "1", cycle: 1, amount: "100000000", ledger: 5, tx_hash: "abc", charged_at: "2026-01-08T00:00:00.000Z" }],
        failures: [{ id: "2", reason: "balance", status: "past_due", ledger: 9, failed_at: "2026-02-07T00:00:00.000Z" }],
        refunds: [],
      }),
    );
    const client = new ApiClient({ baseUrl: "http://api.test", fetchImpl });

    const payments = await client.listPayments("7");

    expect(payments.map((p) => [p.kind, p.amount, p.detail])).toEqual([
      ["failed", null, "Balance too low"],
      ["charge", "100000000", "Cycle 1"],
    ]);
  });

  it("keeps MRR per token and counts live subscriptions", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        mrr: { CUSDC: "100000000" },
        subscriptions: { active: 3, trialing: 1, past_due: 1, cancelled: 2 },
        churn30d: 0.25,
        revenue30d: [{ plan_id: "1", token: "CUSDC", charges: 4, gross: "400000000", fees: "4000000" }],
      }),
    );
    const client = new ApiClient({ baseUrl: "http://api.test", fetchImpl, getApiKey: () => "lsk_test" });

    const summary = await client.getAnalyticsSummary();

    expect(summary).toEqual({
      mrrByToken: { CUSDC: "100000000" },
      activeSubscriptions: 5,
      churnRate: 0.25,
      revenueByPlan: [{ planId: "1", token: "CUSDC", revenue: "400000000", charges: 4 }],
    });
  });

  it("sends the API key on merchant routes", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ data: [] }));
    const client = new ApiClient({ baseUrl: "http://api.test", fetchImpl, getApiKey: () => "lsk_test" });

    await client.listPlans();

    const headers = fetchImpl.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer lsk_test");
  });

  it("refuses merchant routes without a key instead of sending a bad request", async () => {
    const fetchImpl = vi.fn();
    const client = new ApiClient({ baseUrl: "http://api.test", fetchImpl });

    await expect(client.listPlans()).rejects.toMatchObject({ status: 401 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("marks network failures as offline", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    const client = new ApiClient({ baseUrl: "http://api.test", fetchImpl });

    const error = await client.getPlan("1").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).offline).toBe(true);
  });

  it("surfaces the server's error message", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: { code: "not_found", message: "plan not found" } }, 404));
    const client = new ApiClient({ baseUrl: "http://api.test", fetchImpl });

    await expect(client.getPlan("99")).rejects.toMatchObject({ message: "plan not found", status: 404 });
  });

  it("rejects a response that doesn't match the schema", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ...plan, amount: 12.5 }));
    const client = new ApiClient({ baseUrl: "http://api.test", fetchImpl });

    await expect(client.getPlan("1")).rejects.toThrow(/Unexpected response/);
  });
});
