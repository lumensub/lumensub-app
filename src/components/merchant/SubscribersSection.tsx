"use client";

import { formatAmount, shortenAddress, type SubscriptionStatus } from "@lumensub/sdk";
import { useMemo, useState } from "react";
import { Badge, STATUS_TONE } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useI18n } from "@/i18n/I18nProvider";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";

type Filter = "all" | SubscriptionStatus;
const FILTERS: Filter[] = ["all", "Active", "Trialing", "PastDue", "Paused", "Cancelled", "Lapsed"];

export function SubscribersSection() {
  const { t } = useI18n();
  const subs = useAsync(() => api.listMerchantSubscriptions(), []);
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(
    () => (subs.data ?? []).filter((sub) => filter === "all" || sub.status === filter),
    [subs.data, filter],
  );

  return (
    <Card>
      <CardHeader
        title="Subscribers"
        description="Everyone subscribed to one of your plans, newest first."
        action={
          <div>
            <label htmlFor="status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="status-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value as Filter)}
              className="h-8 rounded-lg border border-border bg-surface px-2 text-sm"
            >
              {FILTERS.map((value) => (
                <option key={value} value={value}>
                  {value === "all" ? "All statuses" : t(`status.${value}`)}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {subs.loading && (
        <div className="space-y-3 p-5">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      )}
      {subs.error && (
        <div className="p-5">
          <Alert tone="warning" title="Couldn't load subscribers">
            {subs.error.message}
          </Alert>
        </div>
      )}
      {!subs.loading && !subs.error && rows.length === 0 && (
        <EmptyState title={filter === "all" ? "No subscribers yet" : "Nobody with this status"}>
          {filter === "all" ? "Share a checkout link to get your first subscriber." : "Try a different filter."}
        </EmptyState>
      )}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Subscribers</caption>
            <thead className="border-b border-border text-xs uppercase tracking-wide text-fg-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Subscriber</th>
                <th scope="col" className="px-5 py-3 font-medium">Plan</th>
                <th scope="col" className="px-5 py-3 font-medium">Status</th>
                <th scope="col" className="px-5 py-3 font-medium">Payments</th>
                <th scope="col" className="px-5 py-3 font-medium">Next charge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-5 py-3 font-mono" title={sub.subscriber}>
                    {shortenAddress(sub.subscriber, 6)}
                  </td>
                  <td className="px-5 py-3">
                    {sub.plan?.name ?? `#${sub.planId}`}
                    {sub.plan && (
                      <span className="tabular block text-xs text-fg-muted">{formatAmount(BigInt(sub.plan.amount))}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONE[sub.status]}>{t(`status.${sub.status}`)}</Badge>
                  </td>
                  <td className="tabular px-5 py-3">{sub.cyclesCharged}</td>
                  <td className="px-5 py-3">{formatDate(sub.nextChargeAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
