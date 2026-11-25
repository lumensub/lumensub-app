import { describe, expect, it, vi } from "vitest";
import { ApiClient, ApiError } from "./client";

const plan = {
  id: "1",
  merchant: "GMERCHANT",
  token: "CTOKEN",
  amount: "50000000",
  periodSecs: 2592000,
  active: true,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("ApiClient", () => {
  it("parses a public plan and fills defaults", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(plan));
    const client = new ApiClient({ baseUrl: "http://api.test/", fetchImpl });

    const result = await client.getPlan("1");

    expect(fetchImpl).toHaveBeenCalledWith("http://api.test/v1/plans/1", expect.objectContaining({ method: "GET" }));
    expect(result.trialSecs).toBe(0);
    expect(result.maxCycles).toBe(0);
  });

  it("sends the API key on merchant routes", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse([]));
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
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ message: "Plan not found" }, 404));
    const client = new ApiClient({ baseUrl: "http://api.test", fetchImpl });

    await expect(client.getPlan("99")).rejects.toMatchObject({ message: "Plan not found", status: 404 });
  });

  it("rejects a response that doesn't match the schema", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ...plan, amount: 12.5 }));
    const client = new ApiClient({ baseUrl: "http://api.test", fetchImpl });

    await expect(client.getPlan("1")).rejects.toThrow(/Unexpected response/);
  });
});
