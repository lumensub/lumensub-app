import type { SubscriptionStatus } from "@lumensub/sdk";

export type SubscriptionAction = "pause" | "resume" | "cancel" | "change";

/**
 * Which actions make sense for a subscription in a given state. The contract
 * enforces the same rules; this just keeps the UI from offering buttons
 * that would fail.
 */
export function availableActions(status: SubscriptionStatus): SubscriptionAction[] {
  switch (status) {
    case "Trialing":
    case "Active":
      return ["pause", "change", "cancel"];
    case "PastDue":
      return ["cancel"];
    case "Paused":
      return ["resume", "cancel"];
    default:
      return [];
  }
}
