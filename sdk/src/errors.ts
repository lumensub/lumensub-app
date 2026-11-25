/**
 * The subscription contract's error codes. The numbers are part of the contract's
 * public interface and never change; new codes are only ever added at the end.
 * Messages are written for the person using the app, not for the developer.
 */
export const CONTRACT_ERRORS = {
  1: { name: "NotInitialized", message: "The subscription contract hasn't been set up yet." },
  2: { name: "AlreadyInitialized", message: "The subscription contract is already set up." },
  3: { name: "Unauthorized", message: "This wallet isn't allowed to do that." },
  4: { name: "MerchantNotFound", message: "That merchant isn't registered." },
  5: { name: "PlanNotFound", message: "That plan doesn't exist." },
  6: { name: "PlanInactive", message: "This plan isn't taking new subscribers." },
  7: { name: "SubscriptionNotFound", message: "That subscription doesn't exist." },
  8: { name: "NotDue", message: "This subscription isn't due for a charge yet." },
  9: { name: "InvalidStatus", message: "The subscription's current status doesn't allow that." },
  10: { name: "InvalidAmount", message: "The amount is zero or out of range." },
  11: { name: "InvalidPeriod", message: "The billing period, trial or grace period is out of range." },
  12: { name: "FeeTooHigh", message: "That fee is above the allowed maximum." },
  13: { name: "ProtocolPaused", message: "LumenSub is paused for maintenance. Please try again later." },
  14: { name: "TokenMismatch", message: "The two plans are priced in different tokens." },
  15: { name: "MerchantMismatch", message: "That plan or subscription belongs to a different merchant." },
  16: { name: "RefundTooLarge", message: "The refund is more than the subscriber has paid." },
  17: { name: "InsufficientAllowance", message: "The approved amount is too low. Approve more and try again." },
  18: { name: "InsufficientBalance", message: "There isn't enough of the token in this wallet." },
  19: { name: "NoPendingAdmin", message: "There is no admin transfer waiting to be accepted." },
  20: { name: "SamePlan", message: "You're already on this plan." },
} as const satisfies Record<number, { name: string; message: string }>;

export type ContractErrorCode = keyof typeof CONTRACT_ERRORS;
export type ContractErrorName = (typeof CONTRACT_ERRORS)[ContractErrorCode]["name"];

/**
 * Pulls the contract error code out of a simulation or host error message, which
 * looks like "HostError: Error(Contract, #6)". Returns null for anything else.
 */
export function contractErrorCode(message: string): ContractErrorCode | null {
  const match = /Error\(Contract,\s*#(\d+)\)/.exec(message);
  if (!match) return null;
  const code = Number(match[1]);
  return code in CONTRACT_ERRORS ? (code as ContractErrorCode) : null;
}
