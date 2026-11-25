import { api, ApiError } from "@/lib/api";
import { getLumenSub } from "@/lib/chain";
import type { CheckoutPlan } from "./PlanSummary";

/**
 * Load a plan for checkout. The backend adds the name and description, but
 * the contract is the source of truth for price and terms, so if the API is
 * down we fall back to reading the plan straight from the chain.
 */
export async function loadCheckoutPlan(planId: string): Promise<CheckoutPlan> {
  if (!/^\d+$/.test(planId)) throw new Error("That checkout link isn't valid.");

  try {
    const dto = await api.getPlan(planId);
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      merchant: dto.merchant,
      token: dto.token,
      tokenCode: dto.tokenCode,
      amount: BigInt(dto.amount),
      periodSecs: dto.periodSecs,
      trialSecs: dto.trialSecs,
      maxCycles: dto.maxCycles,
      active: dto.active,
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) throw new Error("This plan doesn't exist.");
    const sdk = getLumenSub();
    if (!sdk) throw err;
    const plan = await sdk.getPlan(BigInt(planId));
    return {
      id: planId,
      merchant: plan.merchant,
      token: plan.token,
      amount: plan.amount,
      periodSecs: Number(plan.periodSecs),
      trialSecs: Number(plan.trialSecs),
      maxCycles: plan.maxCycles,
      active: plan.active,
    };
  }
}
