"use client";

import { explorerTxUrl, formatAmount } from "@lumensub/sdk";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Feedback";
import { api } from "@/lib/api";
import { config } from "@/lib/config";
import { formatDateTime } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";

export function Receipts({ subscriptionId, code }: { subscriptionId: string; code?: string }) {
  const charges = useAsync(() => api.listCharges(subscriptionId), [subscriptionId]);

  if (charges.loading) return <Skeleton className="h-16" />;
  if (charges.error) return <p className="text-sm text-fg-muted">Payment history isn&apos;t available right now.</p>;
  if (!charges.data?.length) return <p className="text-sm text-fg-muted">No payments yet.</p>;

  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Payments for subscription {subscriptionId}</caption>
      <thead className="text-xs text-fg-muted">
        <tr>
          <th scope="col" className="py-2 font-medium">Date</th>
          <th scope="col" className="py-2 font-medium">Amount</th>
          <th scope="col" className="py-2 font-medium">Result</th>
          <th scope="col" className="py-2 font-medium">
            <span className="sr-only">Transaction</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {charges.data.map((charge) => (
          <tr key={charge.id}>
            <td className="py-2">{formatDateTime(charge.createdAt)}</td>
            <td className="tabular py-2">{formatAmount(BigInt(charge.amount), code)}</td>
            <td className="py-2">
              <Badge tone={charge.status === "succeeded" ? "success" : charge.status === "refunded" ? "neutral" : "danger"}>
                {charge.status}
              </Badge>
            </td>
            <td className="py-2 text-right">
              {charge.txHash && (
                <a
                  href={explorerTxUrl(config.network, charge.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  Receipt
                </a>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
