"use client";

import { formatAmount } from "@lumensub/sdk";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Alert, Skeleton } from "@/components/ui/Feedback";
import { Stat } from "@/components/ui/Stat";
import { api, ApiError } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { RevenueChart } from "./RevenueChart";

function percent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function OverviewSection() {
  const summary = useAsync(() => api.getAnalyticsSummary(), []);
  const revenue = useAsync(() => api.getRevenue(30), []);
  const offline = summary.error instanceof ApiError && summary.error.offline;

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
              value={summary.data ? formatAmount(BigInt(summary.data.mrr)) : "-"}
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
        <CardHeader title="Revenue" description="Successful charges per day, last 30 days" />
        <CardBody>
          {revenue.loading && <Skeleton className="h-64" />}
          {!revenue.loading && revenue.data && revenue.data.length > 0 && <RevenueChart points={revenue.data} />}
          {!revenue.loading && (!revenue.data || revenue.data.length === 0) && (
            <p className="py-16 text-center text-sm text-fg-muted">No charges yet. Revenue shows up here after the first payment.</p>
          )}
        </CardBody>
      </Card>

      {summary.data && summary.data.revenueByPlan.length > 0 && (
        <Card>
          <CardHeader title="Revenue by plan" />
          <ul className="divide-y divide-border">
            {summary.data.revenueByPlan.map((row) => (
              <li key={row.planId} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>{row.name ?? `Plan #${row.planId}`}</span>
                <span className="tabular font-medium">{formatAmount(BigInt(row.revenue))}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
