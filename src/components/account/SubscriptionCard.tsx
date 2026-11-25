"use client";

import { formatAmount, formatPeriod, shortenAddress } from "@lumensub/sdk";
import { useState, type FormEvent } from "react";
import { Badge, STATUS_TONE } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { InputField } from "@/components/ui/Field";
import { useI18n } from "@/i18n/I18nProvider";
import type { SubscriptionDto } from "@/lib/api";
import { TX_STEP_LABEL, useTransaction } from "@/lib/chain";
import { formatDate } from "@/lib/dates";
import { tokenLabel } from "@/lib/tokens";
import { availableActions } from "./actions";
import { Receipts } from "./Receipts";

interface Props {
  subscription: SubscriptionDto;
  subscriber: string;
  onChanged: () => void;
}

export function SubscriptionCard({ subscription, subscriber, onChanged }: Props) {
  const { t } = useI18n();
  const tx = useTransaction();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [changing, setChanging] = useState(false);
  const [newPlanId, setNewPlanId] = useState("");
  const [planError, setPlanError] = useState<string>();
  const [showReceipts, setShowReceipts] = useState(false);

  const id = BigInt(subscription.id);
  const plan = subscription.plan;
  const code = plan ? tokenLabel(plan.token, plan.tokenCode) : undefined;
  const actions = availableActions(subscription.status);

  async function act(kind: "pause" | "resume" | "cancel") {
    const done = await tx.run((sdk) =>
      kind === "pause"
        ? sdk.buildPause(subscriber, id)
        : kind === "resume"
          ? sdk.buildResume(subscriber, id)
          : sdk.buildCancel(subscriber, id),
    );
    setConfirmCancel(false);
    if (done) onChanged();
  }

  async function changePlan(event: FormEvent) {
    event.preventDefault();
    if (!/^\d+$/.test(newPlanId.trim()) || newPlanId.trim() === subscription.planId) {
      setPlanError("Enter the number of a different plan from the same merchant.");
      return;
    }
    setPlanError(undefined);
    const done = await tx.run((sdk) => sdk.buildChangePlan(subscriber, id, BigInt(newPlanId.trim())));
    if (done) {
      setChanging(false);
      setNewPlanId("");
      onChanged();
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{plan?.name ?? `Plan #${subscription.planId}`}</h2>
            <Badge tone={STATUS_TONE[subscription.status]}>{t(`status.${subscription.status}`)}</Badge>
          </div>
          {plan && (
            <p className="tabular mt-1 text-sm text-fg-muted">
              {formatAmount(BigInt(plan.amount), code)}, {formatPeriod(plan.periodSecs)} &middot; merchant{" "}
              <span className="font-mono">{shortenAddress(plan.merchant)}</span>
            </p>
          )}
          <p className="mt-1 text-sm text-fg-muted">
            {subscription.cyclesCharged} payments so far
            {subscription.nextChargeAt && actions.length > 0 && <> &middot; next on {formatDate(subscription.nextChargeAt)}</>}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {actions.includes("pause") && (
            <Button variant="secondary" size="sm" onClick={() => act("pause")} disabled={tx.busy}>
              Pause
            </Button>
          )}
          {actions.includes("resume") && (
            <Button size="sm" onClick={() => act("resume")} disabled={tx.busy}>
              Resume
            </Button>
          )}
          {actions.includes("change") && (
            <Button variant="secondary" size="sm" onClick={() => setChanging((open) => !open)} disabled={tx.busy}>
              Change plan
            </Button>
          )}
          {actions.includes("cancel") && !confirmCancel && (
            <Button variant="danger" size="sm" onClick={() => setConfirmCancel(true)} disabled={tx.busy}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {confirmCancel && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-sm">
            Cancel this subscription? No further payments will be taken. This can&apos;t be undone, but you can subscribe again later.
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="danger" size="sm" onClick={() => act("cancel")} loading={tx.busy}>
              Yes, cancel it
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(false)}>
              Keep it
            </Button>
          </div>
        </div>
      )}

      {changing && (
        <form onSubmit={changePlan} className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-end" noValidate>
          <div className="flex-1">
            <InputField
              label="New plan number"
              inputMode="numeric"
              value={newPlanId}
              onChange={(event) => setNewPlanId(event.target.value)}
              error={planError}
              hint="The merchant will tell you the number of the plan to switch to. The new price applies from your next payment."
            />
          </div>
          <Button type="submit" loading={tx.busy}>
            Switch plan
          </Button>
        </form>
      )}

      {(tx.busy || tx.error) && (
        <div className="border-t border-border px-5 py-3">
          {tx.busy && <p className="text-sm text-fg-muted" role="status">{TX_STEP_LABEL[tx.step]}</p>}
          {tx.error && <Alert tone="danger">{tx.error}</Alert>}
        </div>
      )}

      <div className="border-t border-border px-5 py-3">
        <button
          type="button"
          className="text-sm font-medium text-accent hover:underline"
          aria-expanded={showReceipts}
          onClick={() => setShowReceipts((open) => !open)}
        >
          {showReceipts ? "Hide payments" : "Show payments"}
        </button>
        {showReceipts && (
          <div className="mt-3">
            <Receipts subscriptionId={subscription.id} code={code} />
          </div>
        )}
      </div>
    </Card>
  );
}
