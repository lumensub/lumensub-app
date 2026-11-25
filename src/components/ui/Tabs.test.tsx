import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Tabs } from "./Tabs";

const items = [
  { id: "a", label: "Alpha" },
  { id: "b", label: "Beta" },
  { id: "c", label: "Gamma" },
];

function Harness() {
  const [value, setValue] = useState("a");
  return (
    <Tabs items={items} value={value} onChange={setValue} label="Sections">
      <p>Panel {value}</p>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("marks only the selected tab as selected and focusable", () => {
    render(<Harness />);
    const [alpha, beta] = screen.getAllByRole("tab");
    expect(alpha).toHaveAttribute("aria-selected", "true");
    expect(alpha).toHaveAttribute("tabindex", "0");
    expect(beta).toHaveAttribute("tabindex", "-1");
  });

  it("moves with arrow keys and wraps around", () => {
    render(<Harness />);
    const alpha = screen.getByRole("tab", { name: "Alpha" });
    fireEvent.keyDown(alpha, { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Gamma" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel c");
    expect(screen.getByRole("tab", { name: "Gamma" })).toHaveFocus();
  });

  it("jumps to the ends with Home and End", () => {
    render(<Harness />);
    fireEvent.keyDown(screen.getByRole("tab", { name: "Alpha" }), { key: "End" });
    expect(screen.getByRole("tab", { name: "Gamma" })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(screen.getByRole("tab", { name: "Gamma" }), { key: "Home" });
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true");
  });
});
