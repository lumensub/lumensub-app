import Link from "next/link";

const steps = [
  {
    title: "The merchant creates a plan",
    body: "Pick an asset, an amount and how often to charge. Add a free trial or a grace period if you want one. The plan lives in the contract, so its terms can't change under a subscriber.",
  },
  {
    title: "The subscriber approves once",
    body: "Checkout asks for one token allowance and one subscribe call. Funds stay in the subscriber's own wallet until each payment is due.",
  },
  {
    title: "Payments run on schedule",
    body: "When a period ends, anyone can trigger the charge and the contract pays the merchant. Subscribers can pause or cancel whenever they like, straight from their wallet.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-24">
      <section className="max-w-3xl pt-6">
        <p className="text-sm font-medium text-accent">Subscriptions on Stellar</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
          Recurring payments without holding anyone&apos;s card.
        </h1>
        <p className="mt-5 text-lg text-fg-muted">
          LumenSub lets you bill customers monthly, weekly or on any schedule you choose, in USDC, XLM or any Stellar
          asset. The rules live in an open Soroban contract. Merchants get paid on time, and subscribers keep the keys.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/merchant"
            className="inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-medium text-accent-fg hover:bg-accent/90"
          >
            Open the merchant dashboard
          </Link>
          <Link
            href="/docs"
            className="inline-flex h-11 items-center rounded-lg border border-border bg-surface px-5 text-sm font-medium hover:bg-muted"
          >
            Read the integration guide
          </Link>
        </div>
      </section>

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-2xl font-semibold">
          How it works
        </h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-border bg-surface p-6">
              <span className="tabular text-sm font-medium text-accent">0{index + 1}</span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-6 md:grid-cols-2" aria-label="Who it is for">
        <div className="rounded-xl border border-border bg-surface p-8">
          <h2 className="text-xl font-semibold">For merchants</h2>
          <ul className="mt-4 space-y-3 text-sm text-fg-muted">
            <li>Settlement in seconds, with fees measured in fractions of a cent.</li>
            <li>A hosted checkout link you can share, or a button you can drop into any site.</li>
            <li>Signed webhooks for every charge, plus MRR and churn on the dashboard.</li>
            <li>No chargebacks. Refunds are something you choose to send.</li>
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-surface p-8">
          <h2 className="text-xl font-semibold">For subscribers</h2>
          <ul className="mt-4 space-y-3 text-sm text-fg-muted">
            <li>You approve a spending limit, not open access to your wallet.</li>
            <li>Pause, cancel or change plan yourself, any time. No support ticket needed.</li>
            <li>Every payment is an on-chain record you can check.</li>
            <li>Works with Freighter today, with more wallets on the way.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
