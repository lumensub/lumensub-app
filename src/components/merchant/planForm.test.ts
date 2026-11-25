import { describe, expect, it } from "vitest";
import { emptyPlanForm, parsePlanForm } from "./planForm";

const token = "C" + "A".repeat(55);

describe("parsePlanForm", () => {
  it("turns a valid form into contract parameters", () => {
    const result = parsePlanForm({ ...emptyPlanForm(token), name: "Pro", amount: "9.99", trialDays: "7" });
    expect("params" in result).toBe(true);
    if (!("params" in result)) return;
    expect(result.params).toEqual({
      token,
      amount: 99_900_000n,
      periodSecs: 2_592_000n,
      trialSecs: 604_800n,
      graceSecs: 259_200n,
      maxCycles: 0,
    });
    expect(result.name).toBe("Pro");
  });

  it("reports every problem at once", () => {
    const result = parsePlanForm({
      ...emptyPlanForm("not-a-token"),
      name: " ",
      amount: "0",
      periodDays: "0",
      trialDays: "-1",
      maxCycles: "x",
    });
    expect("errors" in result).toBe(true);
    if (!("errors" in result)) return;
    expect(Object.keys(result.errors).sort()).toEqual(["amount", "maxCycles", "name", "periodDays", "token", "trialDays"]);
  });

  it("applies the contract's limits on trial and grace periods", () => {
    const trial = parsePlanForm({ ...emptyPlanForm(token), name: "Pro", amount: "1", trialDays: "366" });
    expect("errors" in trial && trial.errors.trialDays).toMatch(/365 days/);
    const grace = parsePlanForm({ ...emptyPlanForm(token), name: "Yearly", amount: "1", periodDays: "365", graceDays: "31" });
    expect("errors" in grace && grace.errors.graceDays).toMatch(/30 days/);
  });

  it("rejects a grace period as long as the billing period", () => {
    const result = parsePlanForm({ ...emptyPlanForm(token), name: "Weekly", amount: "1", periodDays: "7", graceDays: "7" });
    expect("errors" in result && result.errors.graceDays).toMatch(/shorter/);
  });

  it("rejects more precision than the token supports", () => {
    const result = parsePlanForm({ ...emptyPlanForm(token), name: "Odd", amount: "1.123" }, 2);
    expect("errors" in result && result.errors.amount).toMatch(/2 decimal places/);
  });
});
