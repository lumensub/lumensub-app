"use client";

import { explorerTxUrl, formatAmount } from "@lumensub/sdk";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { TX_STEP_LABEL, useTransaction } from "@/lib/chain";
import { config } from "@/lib/config";
import { tokenLabel } from "@/lib/tokens";
import { approvalFor } from "./approval";
import type { CheckoutPlan } from "./PlanSummary";

type Stage = "connect" | "approve" | "subscribe" | "done";

const STAGES: { id: Stage; label: string }[] = [
  { id: "connect", label: "Connect wallet" },
  { id: "approve", label: "Approve payments" },
  { id: "subscribe", label: "Subscribe" },
];

export function CheckoutFlow({ plan }: { plan: CheckoutPlan }) {
  const { t } = useI18n();
  const { address, connect, status, error: walletError } = useWallet();
  const tx = useTransaction();
  const [approved, setApproved] = useState(false);
  const [subscription, setSubscription] = useState<{ id: string; hash: string } | null>(null);

  const allowance = approvalFor(plan.amount, plan.maxCycles);
  const code = tokenLabel(plan.token, plan.tokenCode);
  const stage: Stage = subscription ? "done" : !address ? "connect" : !approved ? "approve" : "subscribe";

  async function approve() {
    if (!address) return;
    const result = await tx.run(async (sdk) => {
      const expiration = await sdk.approvalExpirationLedger(BigInt(plan.periodSecs), allowance.cycles);
      return sdk.buildApprove(plan.token, address, allowance.total, expiration);
    });
    if (result) {
      setApproved(true);
      tx.reset();
    }
  }

  async function subscribe() {
    if (!address) return;
    const result = await tx.run((sdk) => sdk.buildSubscribe(address, BigInt(plan.id)));
    if (result) setSubscription({ id: String(result.returnValue ?? ""), hash: result.hash });
  }

  if (!plan.active) {
    return (
      <Alert tone="warning" title="This plan isn't taking new subscribers">
        The merchant has archived it. Existing subscriptions keep working.
      </Alert>
    );
  }

  if (stage === "done" && subscription) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold">{t("checkout.success")}</h2>
        <p className="mt-2 text-fg-muted">
          Subscription #{subscription.id} is set up. You can pause or cancel it any time from your subscriptions page.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/account"
            className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent/90"
          >
            Manage subscriptions
          </Link>
          <a
            href={explorerTxUrl(config.network, subscription.hash)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
          >
            View transaction
          </a>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">{t("checkout.title")}</h2>
      <ol className="mt-4 space-y-3" aria-label="Checkout steps">
        {STAGES.map((item, index) => {
          const position = STAGES.findIndex((s) => s.id === stage);
          const done = index < position;
          const current = item.id === stage;
          return (
            <li key={item.id} className="flex items-center gap-3 text-sm" aria-current={current ? "step" : undefined}>
              <span
                aria-hidden
                className={
                  done
                    ? "grid h-6 w-6 place-items-center rounded-full bg-success text-xs text-white"
                    : current
                      ? "grid h-6 w-6 place-items-center rounded-full bg-accent text-xs text-accent-fg"
                      : "grid h-6 w-6 place-items-center rounded-full bg-muted text-xs text-fg-muted"
                }
              >
                {done ? "✓" : index + 1}
              </span>
              <span className={current ? "font-medium" : "text-fg-muted"}>
                {item.label}
                {done && <span className="sr-only"> (done)</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 space-y-4">
        {stage === "connect" && (
          <>
            <p className="text-sm text-fg-muted">Connect a Stellar wallet that holds {code}. LumenSub works with Freighter.</p>
            {walletError && <Alert tone="danger">{walletError}</Alert>}
            <Button size="lg" className="w-full" onClick={() => void connect()} loading={status === "connecting"}>
              {t("wallet.connect")}
            </Button>
          </>
        )}

        {stage === "approve" && (
          <>
            <p className="text-sm text-fg-muted">
              This lets the subscription contract take up to{" "}
              <strong className="tabular text-fg">{formatAmount(allowance.total, code)}</strong> across{" "}
              {allowance.cycles} payments. It can&apos;t take more than one payment per billing period, and you can
              cancel whenever you want.
            </p>
            <Button size="lg" className="w-full" onClick={approve} loading={tx.busy}>
              Approve {formatAmount(allowance.total, code)}
            </Button>
          </>
        )}

        {stage === "subscribe" && (
          <>
            <p className="text-sm text-fg-muted">Last step. Confirm the subscription in your wallet.</p>
            <Button size="lg" className="w-full" onClick={subscribe} loading={tx.busy}>
              {t("checkout.approve")}
            </Button>
          </>
        )}

        {tx.busy && (
          <p className="text-sm text-fg-muted" role="status">
            {TX_STEP_LABEL[tx.step]}
          </p>
        )}
        {tx.error && <Alert tone="danger">{tx.error}</Alert>}
      </div>
    </Card>
  );
}
