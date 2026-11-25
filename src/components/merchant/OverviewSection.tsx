"use client";

import { formatAmount } from "@lumensub/sdk";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Alert, Skeleton } from "@/components/ui/Feedback";
import { Stat } from "@/components/ui/Stat";
import { api, ApiError } from "@/lib/api";
import { tokenLabel } from "@/lib/tokens";
import { useAsync } from "@/lib/useAsync";
import { RevenueChart } from "./RevenueChart";

function percent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/** Amounts in different tokens can't be added, so MRR is shown per token. */
function formatPerToken(byToken: Record<string, string>): string {
  const entries = Object.entries(byToken);
  if (entries.length === 0) return formatAmount(0n);
  return entries.map(([token, value]) => formatAmount(BigInt(value), tokenLabel(token))).join(" + ");
}

export function OverviewSection() {
  const summary = useAsync(() => api.getAnalyticsSummary(), []);
  const revenue = useAsync(() => api.getRevenue(30), []);
  const offline = summary.error instanceof ApiError && summary.error.offline;

  // The chart shows one token: the one with the most revenue in the window.
  const totals = new Map<string, bigint>();
  for (const point of revenue.data ?? []) totals.set(point.token, (totals.get(point.token) ?? 0n) + BigInt(point.revenue));
  const chartToken = [...totals.entries()].sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : 0))[0]?.[0];
  const chartPoints = (revenue.data ?? []).filter((point) => point.token === chartToken);

  return (
    <div className="space-y-6">
      {summary.error && (
        <Alert tone={offline ? "warning" : "danger"} title="Couldn't load your numbers">
          {summary.error.message}
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {summary.loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Stat
              label="Monthly recurring revenue"
              value={summary.data ? formatPerToken(summary.data.mrrByToken) : "-"}
              detail="All active plans, normalised to 30 days"
            />
            <Stat label="Active subscriptions" value={summary.data?.activeSubscriptions ?? "-"} />
            <Stat
              label="Churn, last 30 days"
              value={summary.data ? percent(summary.data.churnRate) : "-"}
              detail="Cancelled or lapsed, as a share of the starting count"
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader
          title="Revenue"
          description={`Successful charges per day, last 30 days${chartToken && totals.size > 1 ? `, in ${tokenLabel(chartToken)}` : ""}`}
        />
        <CardBody>
          {revenue.loading && <Skeleton className="h-64" />}
          {!revenue.loading && chartToken && <RevenueChart points={chartPoints} code={tokenLabel(chartToken)} />}
          {!revenue.loading && !chartToken && (
            <p className="py-16 text-center text-sm text-fg-muted">No charges yet. Revenue shows up here after the first payment.</p>
          )}
        </CardBody>
      </Card>

      {summary.data && summary.data.revenueByPlan.length > 0 && (
        <Card>
          <CardHeader title="Revenue by plan" />
          <ul className="divide-y divide-border">
            {summary.data.revenueByPlan.map((row) => (
              <li key={`${row.planId}-${row.token}`} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>
                  Plan #{row.planId}
                  <span className="ml-2 text-xs text-fg-muted">
                    {row.charges} {row.charges === 1 ? "charge" : "charges"}
                  </span>
                </span>
                <span className="tabular font-medium">{formatAmount(BigInt(row.revenue), tokenLabel(row.token))}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
