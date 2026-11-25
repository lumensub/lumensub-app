"use client";

import { useParams } from "next/navigation";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { loadCheckoutPlan } from "@/components/checkout/loadPlan";
import { PlanSummary } from "@/components/checkout/PlanSummary";
import { Button } from "@/components/ui/Button";
import { Alert, Skeleton } from "@/components/ui/Feedback";
import { useAsync } from "@/lib/useAsync";

export default function CheckoutPage() {
  const params = useParams<{ planId: string }>();
  const planId = params?.planId ?? "";
  const plan = useAsync(() => loadCheckoutPlan(planId), [planId], Boolean(planId));

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1.1fr_1fr]">
      {plan.loading && (
        <>
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </>
      )}
      {plan.error && (
        <div className="md:col-span-2">
          <Alert tone="danger" title="We couldn't load this plan">
            <p>{plan.error.message}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={plan.reload}>
              Try again
            </Button>
          </Alert>
        </div>
      )}
      {plan.data && (
        <>
          <PlanSummary plan={plan.data} />
          <CheckoutFlow plan={plan.data} />
        </>
      )}
    </div>
  );
}
