"use client";

import { SubscriptionCard } from "@/components/account/SubscriptionCard";
import { Card } from "@/components/ui/Card";
import { Alert, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { api, ApiError } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";

export default function AccountPage() {
  const { t } = useI18n();
  const { address } = useWallet();
  const subs = useAsync(() => api.listSubscriptionsFor(address!), [address], Boolean(address));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{t("account.title")}</h1>
        <p className="mt-2 text-fg-muted">Everything this wallet is subscribed to. Changes are signed by you and settled on chain.</p>
      </div>

      {!address && (
        <Card>
          <EmptyState title="Connect your wallet" action={<ConnectButton size="md" />}>
            We&apos;ll look up subscriptions for the address you connect. Nothing is shared until you sign.
          </EmptyState>
        </Card>
      )}

      {address && subs.loading && (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {address && subs.error && (
        <Alert
          tone={subs.error instanceof ApiError && subs.error.offline ? "warning" : "danger"}
          title="Couldn't load your subscriptions"
        >
          {subs.error instanceof ApiError && subs.error.offline ? t("common.offline") : subs.error.message}
        </Alert>
      )}

      {address && subs.data?.length === 0 && (
        <Card>
          <EmptyState title={t("account.empty")}>Subscriptions you start through a LumenSub checkout will show up here.</EmptyState>
        </Card>
      )}

      {address &&
        subs.data?.map((subscription) => (
          <SubscriptionCard key={subscription.id} subscription={subscription} subscriber={address} onChanged={subs.reload} />
        ))}
    </div>
  );
}
