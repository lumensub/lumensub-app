"use client";

import { formatAmount, formatPeriod } from "@lumensub/sdk";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Alert, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useWallet } from "@/components/wallet/WalletProvider";
import { api, type PlanDto } from "@/lib/api";
import { useTransaction } from "@/lib/chain";
import { tokenLabel } from "@/lib/tokens";
import { useAsync } from "@/lib/useAsync";
import { CreatePlanForm } from "./CreatePlanForm";

function checkoutUrl(planId: string): string {
  return typeof window === "undefined" ? `/pay/${planId}` : `${window.location.origin}/pay/${planId}`;
}

function PlanRow({ plan, onChanged }: { plan: PlanDto; onChanged: () => void }) {
  const { address } = useWallet();
  const tx = useTransaction();
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(checkoutUrl(plan.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be blocked; the link is also shown as text
    }
  }

  async function toggleActive() {
    if (!address) return;
    const done = await tx.run((sdk) => sdk.buildSetPlanActive(address, BigInt(plan.id), !plan.active));
    if (done) onChanged();
  }

  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{plan.name ?? `Plan #${plan.id}`}</p>
          <Badge tone={plan.active ? "success" : "neutral"}>{plan.active ? "Active" : "Archived"}</Badge>
        </div>
        <p className="tabular mt-1 text-sm text-fg-muted">
          {formatAmount(BigInt(plan.amount), tokenLabel(plan.token, plan.tokenCode))}, {formatPeriod(plan.periodSecs)}
          {plan.trialSecs > 0 && `, ${plan.trialSecs / 86_400}-day trial`}
        </p>
        {tx.error && <p className="mt-1 text-sm text-danger">{tx.error}</p>}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="secondary" size="sm" onClick={copyLink} aria-label={`Copy checkout link for ${plan.name ?? plan.id}`}>
          {copied ? "Copied" : "Copy checkout link"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleActive}
          loading={tx.busy}
          disabled={!address}
          title={address ? undefined : "Connect the merchant wallet to change this plan"}
        >
          {plan.active ? "Archive" : "Reactivate"}
        </Button>
      </div>
    </li>
  );
}

export function PlansSection() {
  const plans = useAsync(() => api.listPlans(), []);
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {createdId && (
        <Alert tone="success" title={`Plan #${createdId} is live`}>
          Share <span className="font-mono">{checkoutUrl(createdId)}</span> with customers to start taking subscriptions.
        </Alert>
      )}

      <Card>
        <CardHeader
          title="Plans"
          description="Each plan is stored in the contract. Archived plans keep billing existing subscribers but accept no new ones."
          action={
            <Button size="sm" variant={creating ? "secondary" : "primary"} onClick={() => setCreating((open) => !open)}>
              {creating ? "Close" : "New plan"}
            </Button>
          }
        />
        {creating && (
          <CardBody className="border-b border-border">
            <CreatePlanForm
              onCreated={(id) => {
                setCreatedId(id);
                setCreating(false);
                plans.reload();
              }}
            />
          </CardBody>
        )}

        {plans.loading && (
          <CardBody className="space-y-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </CardBody>
        )}
        {plans.error && (
          <CardBody>
            <Alert tone="warning" title="Couldn't load plans">
              {plans.error.message}
            </Alert>
          </CardBody>
        )}
        {plans.data && plans.data.length === 0 && (
          <EmptyState title="No plans yet">Create a plan to get a checkout link you can share.</EmptyState>
        )}
        {plans.data && plans.data.length > 0 && (
          <ul className="divide-y divide-border">
            {plans.data.map((plan) => (
              <PlanRow key={plan.id} plan={plan} onChanged={plans.reload} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
