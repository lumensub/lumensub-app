import { Asset } from "@stellar/stellar-sdk";
import { config } from "./config";

export interface TokenOption {
  code: string;
  contractId: string;
  decimals: number;
}

/**
 * Tokens offered by default in the plan form. Native XLM's contract address
 * is derived from the network passphrase, so it is always correct for the
 * configured network. Other assets can be pasted in by contract address.
 */
export function defaultTokens(): TokenOption[] {
  return [{ code: "XLM", contractId: Asset.native().contractId(config.network.passphrase), decimals: 7 }];
}

/** Best-effort asset code for display; falls back to a shortened address. */
export function tokenLabel(contractId: string, code?: string): string {
  if (code) return code;
  const known = defaultTokens().find((token) => token.contractId === contractId);
  return known ? known.code : `${contractId.slice(0, 4)}...${contractId.slice(-4)}`;
}
