"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { config } from "@/lib/config";
import { assertNetwork, connectFreighter, getConnectedAddress, signWithFreighter, WalletError } from "@/lib/wallet";

type Status = "idle" | "connecting" | "connected" | "error";

interface WalletValue {
  address: string | null;
  status: Status;
  error: string | null;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  /** Sign a prepared transaction with the connected account. */
  sign: (xdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // Restore a previous connection quietly; never prompt on page load.
  useEffect(() => {
    let cancelled = false;
    getConnectedAddress().then((existing) => {
      if (!cancelled && existing) {
        setAddress(existing);
        setStatus("connected");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    try {
      const next = await connectFreighter();
      setAddress(next);
      setStatus("connected");
      return next;
    } catch (err) {
      setError(err instanceof WalletError ? err.message : "Couldn't connect to your wallet.");
      setStatus("error");
      return null;
    }
  }, []);

  const disconnect = useCallback(() => {
    // Freighter has no programmatic disconnect; forgetting the address is
    // enough for this app.
    setAddress(null);
    setStatus("idle");
    setError(null);
  }, []);

  const sign = useCallback(
    async (xdr: string) => {
      if (!address) throw new WalletError("Connect a wallet first.");
      await assertNetwork(config.network.passphrase);
      return signWithFreighter(xdr, address, config.network.passphrase);
    },
    [address],
  );

  const value = useMemo(
    () => ({ address, status, error, connect, disconnect, sign }),
    [address, status, error, connect, disconnect, sign],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletValue {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider");
  return value;
}
