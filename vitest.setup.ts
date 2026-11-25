import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Recent Node versions ship an experimental global localStorage that shadows
// jsdom's and is undefined unless Node is started with a storage file. Give
// tests a plain in-memory Storage so behaviour matches a browser.
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => Array.from(data.keys())[index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
}

for (const name of ["localStorage", "sessionStorage"] as const) {
  if (typeof window !== "undefined" && !window[name]) {
    Object.defineProperty(window, name, { value: memoryStorage(), configurable: true });
  }
}

afterEach(() => {
  cleanup();
});
