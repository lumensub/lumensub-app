import { toBaseUnits, type CreatePlanParams } from "@lumensub/sdk";

const DAY = 86_400n;

export const PERIOD_OPTIONS = [
  { value: "7", label: "Weekly" },
  { value: "30", label: "Monthly (30 days)" },
  { value: "90", label: "Quarterly (90 days)" },
  { value: "365", label: "Yearly (365 days)" },
] as const;

export interface PlanFormValues {
  name: string;
  description: string;
  token: string;
  amount: string;
  periodDays: string;
  trialDays: string;
  graceDays: string;
  maxCycles: string;
}

export const emptyPlanForm = (token: string): PlanFormValues => ({
  name: "",
  description: "",
  token,
  amount: "",
  periodDays: "30",
  trialDays: "0",
  graceDays: "3",
  maxCycles: "0",
});

export type PlanFormErrors = Partial<Record<keyof PlanFormValues, string>>;

function wholeNumber(value: string): number | null {
  return /^\d+$/.test(value.trim()) ? Number(value.trim()) : null;
}

/**
 * Validate the form and turn it into contract parameters. Returns either
 * errors keyed by field or the params, never both.
 */
export function parsePlanForm(
  values: PlanFormValues,
  decimals = 7,
): { errors: PlanFormErrors } | { params: CreatePlanParams; name: string; description: string } {
  const errors: PlanFormErrors = {};

  if (!values.name.trim()) errors.name = "Give the plan a name customers will recognise.";
  if (values.name.trim().length > 60) errors.name = "Keep the name under 60 characters.";
  if (!/^C[A-Z2-7]{55}$/.test(values.token.trim())) errors.token = "Enter a token contract address (starts with C).";

  let amount = 0n;
  try {
    amount = toBaseUnits(values.amount, decimals);
    if (amount <= 0n) errors.amount = "The price must be more than zero.";
  } catch {
    errors.amount = `Enter a price like 9.99, with up to ${decimals} decimal places.`;
  }

  const period = wholeNumber(values.periodDays);
  if (!period || period < 1) errors.periodDays = "The billing period must be at least one day.";

  const trial = wholeNumber(values.trialDays);
  if (trial === null) errors.trialDays = "Use a whole number of days, or 0 for no trial.";

  const grace = wholeNumber(values.graceDays);
  if (grace === null) errors.graceDays = "Use a whole number of days.";
  else if (period && grace >= period) errors.graceDays = "The grace period has to be shorter than the billing period.";

  const cycles = wholeNumber(values.maxCycles);
  if (cycles === null) errors.maxCycles = "Use a whole number, or 0 to renew until cancelled.";

  if (Object.keys(errors).length > 0) return { errors };

  return {
    name: values.name.trim(),
    description: values.description.trim(),
    params: {
      token: values.token.trim(),
      amount,
      periodSecs: BigInt(period!) * DAY,
      trialSecs: BigInt(trial!) * DAY,
      graceSecs: BigInt(grace!) * DAY,
      maxCycles: cycles!,
    },
  };
}
