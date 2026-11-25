"use client";

import { LumenSubClient, type SubmitResult } from "@lumensub/sdk";
import { useCallback, useState } from "react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { config, isChainConfigured } from "./config";

let client: LumenSubClient | null = null;

/** Shared SDK client, or null when the contract isn't configured. */
export function getLumenSub(): LumenSubClient | null {
  if (!isChainConfigured) return null;
  client ??= new LumenSubClient({
    rpcUrl: config.rpcUrl,
    networkPassphrase: config.network.passphrase,
    contractId: config.contractId,
  });
  return client;
}

export type TxStep = "idle" | "building" | "signing" | "submitting" | "done" | "error";

/**
 * Build, sign and submit a transaction in one go, exposing which step it is
 * on so the UI can say something more useful than "loading".
 */
export function useTransaction() {
  const { sign } = useWallet();
  const [step, setStep] = useState<TxStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const run = useCallback(
    async (build: (sdk: LumenSubClient) => Promise<string>): Promise<SubmitResult | null> => {
      const sdk = getLumenSub();
      if (!sdk) {
        setError("The subscription contract isn't configured for this deployment.");
        setStep("error");
        return null;
      }
      setError(null);
      try {
        setStep("building");
        const unsigned = await build(sdk);
        setStep("signing");
        const signed = await sign(unsigned);
        setStep("submitting");
        const submitted = await sdk.submit(signed);
        setResult(submitted);
        setStep("done");
        return submitted;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setStep("error");
        return null;
      }
    },
    [sign],
  );

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setResult(null);
  }, []);

  return { run, reset, step, error, result, busy: step === "building" || step === "signing" || step === "submitting" };
}

export const TX_STEP_LABEL: Record<TxStep, string> = {
  idle: "",
  building: "Preparing the transaction...",
  signing: "Waiting for your signature in Freighter...",
  submitting: "Submitting to the network...",
  done: "Confirmed.",
  error: "",
};
