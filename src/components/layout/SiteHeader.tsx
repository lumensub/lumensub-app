"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALE_NAMES, type Locale } from "@/i18n/messages";
import { cn } from "@/lib/cn";

export function SiteHeader() {
  const pathname = usePathname();
  const { t, locale, setLocale } = useI18n();

  const links = [
    { href: "/merchant", label: t("nav.merchants") },
    { href: "/account", label: t("nav.account") },
    { href: "/docs", label: t("nav.docs") },
  ];

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        {t("nav.skip")}
      </a>
      <div className="mx-auto flex h-16 max-w-content items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-md bg-accent text-sm text-accent-fg">
            L
          </span>
          LumenSub
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const current = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm",
                  current ? "font-medium text-fg" : "text-fg-muted hover:text-fg",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <label className="sr-only" htmlFor="locale">
            {t("locale.label")}
          </label>
          <select
            id="locale"
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
            className="hidden h-9 rounded-lg border border-border bg-surface px-2 text-sm sm:block"
          >
            {Object.entries(LOCALE_NAMES).map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>

      <nav aria-label="Main mobile" className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={pathname?.startsWith(link.href) ? "page" : undefined}
            className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-fg-muted aria-[current=page]:bg-muted aria-[current=page]:text-fg"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
