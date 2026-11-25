import { formatAmount, formatPeriod, shortenAddress } from "@lumensub/sdk";
import { Card } from "@/components/ui/Card";
import { tokenLabel } from "@/lib/tokens";

export interface CheckoutPlan {
  id: string;
  name?: string;
  description?: string;
  merchant: string;
  token: string;
  tokenCode?: string;
  amount: bigint;
  periodSecs: number;
  trialSecs: number;
  maxCycles: number;
  active: boolean;
}

export function PlanSummary({ plan }: { plan: CheckoutPlan }) {
  const code = tokenLabel(plan.token, plan.tokenCode);
  const trialDays = Math.round(plan.trialSecs / 86_400);

  return (
    <Card className="p-6">
      <p className="text-sm text-fg-muted">Merchant {shortenAddress(plan.merchant, 6)}</p>
      <h1 className="mt-2 text-2xl font-semibold">{plan.name ?? `Plan #${plan.id}`}</h1>
      {plan.description && <p className="mt-2 text-fg-muted">{plan.description}</p>}

      <p className="mt-6">
        <span className="tabular text-3xl font-semibold">{formatAmount(plan.amount, code)}</span>
        <span className="ml-2 text-fg-muted">{formatPeriod(plan.periodSecs)}</span>
      </p>

      <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-fg-muted">First payment</dt>
          <dd>{trialDays > 0 ? `After a ${trialDays}-day free trial` : "Today"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-fg-muted">Length</dt>
          <dd>{plan.maxCycles > 0 ? `${plan.maxCycles} payments` : "Until you cancel"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-fg-muted">Cancel</dt>
          <dd>Any time, from your wallet</dd>
        </div>
      </dl>
    </Card>
  );
}
