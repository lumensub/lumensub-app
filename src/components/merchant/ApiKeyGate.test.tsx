import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ApiKeyGate } from "./ApiKeyGate";

describe("ApiKeyGate", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("asks for a key when none is stored", async () => {
    render(<ApiKeyGate>{() => <p>Dashboard</p>}</ApiKeyGate>);
    expect(await screen.findByLabelText("API key")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("rejects something that isn't a key", async () => {
    render(<ApiKeyGate>{() => <p>Dashboard</p>}</ApiKeyGate>);
    fireEvent.change(await screen.findByLabelText("API key"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText("API key")).toHaveAttribute("aria-invalid", "true");
  });

  it("stores a valid key and shows the dashboard", async () => {
    render(<ApiKeyGate>{() => <p>Dashboard</p>}</ApiKeyGate>);
    fireEvent.change(await screen.findByLabelText("API key"), { target: { value: "lsk_live_1234567890" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(window.localStorage.getItem("lumensub.apiKey")).toBe("lsk_live_1234567890");
  });

  it("forgets the key on sign out", async () => {
    window.localStorage.setItem("lumensub.apiKey", "lsk_live_1234567890");
    render(<ApiKeyGate>{(signOut) => <button onClick={signOut}>Sign out</button>}</ApiKeyGate>);
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));
    expect(await screen.findByLabelText("API key")).toBeInTheDocument();
    expect(window.localStorage.getItem("lumensub.apiKey")).toBeNull();
  });
});
