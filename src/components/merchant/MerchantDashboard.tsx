"use client";

import { useEffect, useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { useI18n } from "@/i18n/I18nProvider";
import { ApiKeyGate } from "./ApiKeyGate";
import { ApiKeysSection } from "./ApiKeysSection";
import { OverviewSection } from "./OverviewSection";
import { PlansSection } from "./PlansSection";
import { SubscribersSection } from "./SubscribersSection";
import { WebhooksSection } from "./WebhooksSection";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "plans", label: "Plans" },
  { id: "subscribers", label: "Subscribers" },
  { id: "webhooks", label: "Webhooks" },
  { id: "keys", label: "API keys" },
];

export function MerchantDashboard() {
  const { t } = useI18n();
  const [tab, setTab] = useState("overview");

  // Keep the selected tab in the URL hash so links and refreshes land on it.
  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (TABS.some((item) => item.id === fromHash)) setTab(fromHash);
  }, []);

  function select(id: string) {
    setTab(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">{t("merchant.title")}</h1>
        <p className="mt-2 text-fg-muted">Plans, subscribers and payouts for your business.</p>
      </div>
      <ApiKeyGate>
        {(signOut) => (
          <Tabs items={TABS} value={tab} onChange={select} label="Dashboard sections">
            {tab === "overview" && <OverviewSection />}
            {tab === "plans" && <PlansSection />}
            {tab === "subscribers" && <SubscribersSection />}
            {tab === "webhooks" && <WebhooksSection />}
            {tab === "keys" && <ApiKeysSection onSignOut={signOut} />}
          </Tabs>
        )}
      </ApiKeyGate>
    </div>
  );
}
