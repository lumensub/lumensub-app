import { getNetwork } from "@lumensub/sdk";
import { z } from "zod";

/**
 * Public runtime configuration. Next.js inlines NEXT_PUBLIC_* values at build
 * time, so each one has to be referenced by its full name here.
 */
const schema = z.object({
  network: z.enum(["testnet", "mainnet", "futurenet"]).default("testnet"),
  rpcUrl: z.string().url().optional(),
  contractId: z
    .string()
    .regex(/^C[A-Z2-7]{55}$/, "NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_ID must be a contract address")
    .optional(),
  apiUrl: z.string().url().default("http://localhost:8080"),
});

const parsed = schema.safeParse({
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || undefined,
  rpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || undefined,
  contractId: process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_ID || undefined,
  apiUrl: process.env.NEXT_PUBLIC_API_URL || undefined,
});

if (!parsed.success) {
  console.error("Invalid public configuration:", parsed.error.flatten().fieldErrors);
}

const values = parsed.success ? parsed.data : schema.parse({});
const network = getNetwork(values.network);

export const config = {
  network,
  rpcUrl: values.rpcUrl ?? network.rpcUrl,
  contractId: values.contractId ?? "",
  apiUrl: values.apiUrl.replace(/\/$/, ""),
} as const;

/** True when enough is configured to talk to the contract. */
export const isChainConfigured = Boolean(config.contractId && config.rpcUrl);
