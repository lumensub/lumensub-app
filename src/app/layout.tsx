import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { themeInitScript } from "@/components/theme/ThemeToggle";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { I18nProvider } from "@/i18n/I18nProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "LumenSub: recurring payments on Stellar",
    template: "%s | LumenSub",
  },
  description:
    "Charge customers on a schedule in USDC or XLM. Subscribers approve once, keep control of their funds and can cancel at any time.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#101013" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen font-sans">
        <I18nProvider>
          <WalletProvider>
            <SiteHeader />
            <main id="main" className="mx-auto max-w-content px-4 py-10 sm:px-6">
              {children}
            </main>
            <SiteFooter />
          </WalletProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
