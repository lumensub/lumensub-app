"use client";

import { explorerTxUrl, formatAmount } from "@lumensub/sdk";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Feedback";
import { api } from "@/lib/api";
import { config } from "@/lib/config";
import { formatDateTime } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";

export function Receipts({ subscriptionId, code }: { subscriptionId: string; code?: string }) {
  const payments = useAsync(() => api.listPayments(subscriptionId), [subscriptionId]);

  if (payments.loading) return <Skeleton className="h-16" />;
  if (payments.error) return <p className="text-sm text-fg-muted">Payment history isn&apos;t available right now.</p>;
  if (!payments.data?.length) return <p className="text-sm text-fg-muted">No payments yet.</p>;

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
        {payments.data.map((payment) => (
          <tr key={payment.id}>
            <td className="py-2">{formatDateTime(payment.at)}</td>
            <td className="tabular py-2">{payment.amount === null ? "-" : formatAmount(BigInt(payment.amount), code)}</td>
            <td className="py-2">
              <Badge tone={payment.kind === "charge" ? "success" : payment.kind === "refund" ? "neutral" : "danger"}>
                {payment.kind === "charge" ? "Paid" : payment.kind === "refund" ? "Refunded" : "Failed"}
              </Badge>
              <span className="ml-2 text-xs text-fg-muted">{payment.detail}</span>
            </td>
            <td className="py-2 text-right">
              {payment.txHash && (
                <a
                  href={explorerTxUrl(config.network, payment.txHash)}
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
