import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InputField } from "./Field";

describe("InputField", () => {
  it("connects the label to the input", () => {
    render(<InputField label="Plan name" />);
    expect(screen.getByLabelText("Plan name")).toBeInTheDocument();
  });

  it("describes the input with its hint", () => {
    render(<InputField label="Grace period" hint="Days before the subscription lapses" />);
    expect(screen.getByLabelText("Grace period")).toHaveAccessibleDescription("Days before the subscription lapses");
  });

  it("swaps the hint for the error and marks the input invalid", () => {
    render(<InputField label="Price" hint="In USDC" error="The price must be more than zero." />);
    const input = screen.getByLabelText("Price");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("The price must be more than zero.");
    expect(screen.queryByText("In USDC")).not.toBeInTheDocument();
  });
});
