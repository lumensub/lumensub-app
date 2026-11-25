import { config } from "@/lib/config";
import { ApiClient } from "./client";

export * from "./client";
export * from "./schemas";

const API_KEY_STORAGE = "lumensub.apiKey";

/** The merchant's API key lives only in this browser's storage. */
export function readApiKey(): string | undefined {
  try {
    return window.localStorage.getItem(API_KEY_STORAGE) ?? undefined;
  } catch {
    return undefined;
  }
}

export function writeApiKey(value: string | null): void {
  try {
    if (value) window.localStorage.setItem(API_KEY_STORAGE, value);
    else window.localStorage.removeItem(API_KEY_STORAGE);
  } catch {
    // storage can be blocked; the key simply won't persist
  }
}

export const api = new ApiClient({ baseUrl: config.apiUrl, getApiKey: readApiKey });
