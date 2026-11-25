"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { config } from "@/lib/config";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-content flex-col gap-4 px-4 py-8 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>{t("footer.note")}</p>
        <div className="flex items-center gap-4">
          <span className="rounded-full border border-border px-2 py-0.5 text-xs capitalize">{config.network.name}</span>
          <Link href="/docs" className="hover:text-fg">
            {t("nav.docs")}
          </Link>
          <a href="https://github.com/lumensub" className="hover:text-fg" rel="noreferrer" target="_blank">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
