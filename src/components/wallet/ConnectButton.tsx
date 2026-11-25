"use client";

import { shortenAddress } from "@lumensub/sdk";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";
import { useWallet } from "./WalletProvider";

export function ConnectButton({ size = "sm", ...rest }: Omit<ButtonProps, "onClick">) {
  const { address, status, connect, disconnect } = useWallet();
  const { t } = useI18n();

  if (address) {
    return (
      <Button
        variant="secondary"
        size={size}
        onClick={disconnect}
        title={`${address} (${t("wallet.disconnect")})`}
        aria-label={`${t("wallet.disconnect")} ${address}`}
        {...rest}
      >
        <span aria-hidden className="h-2 w-2 rounded-full bg-success" />
        <span className="font-mono">{shortenAddress(address)}</span>
      </Button>
    );
  }

  return (
    <Button size={size} onClick={() => void connect()} loading={status === "connecting"} {...rest}>
      {status === "connecting" ? t("wallet.connecting") : t("wallet.connect")}
    </Button>
  );
}
