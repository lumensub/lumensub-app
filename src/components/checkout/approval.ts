/** Payments an open-ended plan approves up front; subscribers can top up later. */
export const DEFAULT_APPROVAL_CYCLES = 12;

export interface ApprovalPlan {
  cycles: number;
  total: bigint;
}

/**
 * How much allowance to ask for. Fixed-length plans approve exactly what
 * they will ever charge. Open-ended plans approve a year's worth of monthly
 * payments (or the equivalent count), never an unlimited amount.
 */
export function approvalFor(amount: bigint, maxCycles: number): ApprovalPlan {
  const cycles = maxCycles > 0 ? maxCycles : DEFAULT_APPROVAL_CYCLES;
  return { cycles, total: amount * BigInt(cycles) };
}
