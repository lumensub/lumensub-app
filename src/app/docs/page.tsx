import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { subscribeButtonHtml } from "@/components/docs/embed";

export const metadata: Metadata = {
  title: "Integration guide",
};

const sdkExample = `import { LumenSubClient, NETWORKS, toBaseUnits } from "@lumensub/sdk";

const lumensub = new LumenSubClient({
  rpcUrl: NETWORKS.testnet.rpcUrl,
  networkPassphrase: NETWORKS.testnet.passphrase,
  contractId: process.env.SUBSCRIPTION_CONTRACT_ID!,
});

// Build an unsigned transaction, sign it with any wallet, then submit.
const xdr = await lumensub.buildCreatePlan(merchantAddress, {
  token: usdcContractId,
  amount: toBaseUnits("9.99"),
  periodSecs: 30n * 86_400n,
  trialSecs: 7n * 86_400n,
});
const { returnValue: planId } = await lumensub.submit(await sign(xdr));`;

const webhookExample = `import { createHmac, timingSafeEqual } from "node:crypto";

// header is the LumenSub-Signature value, e.g. "t=1772366400,v1=6f1e0c8b..."
export function isValidSignature(rawBody: string, header: string, secret: string, toleranceSecs = 300) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.trim().split("=")));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSecs) return false;

  const expected = createHmac("sha256", secret).update(\`\${t}.\${rawBody}\`).digest();
  const given = Buffer.from(parts.v1 ?? "", "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}`;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 id={id} className="text-xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DocsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-12">
      <header>
        <h1 className="text-3xl font-semibold">Integration guide</h1>
        <p className="mt-3 text-fg-muted">
          There are three ways to take subscriptions with LumenSub. Start with the checkout link. Move to the button or
          the SDK when you want it to feel like part of your own product.
        </p>
      </header>

      <Section id="link" title="1. Share a checkout link">
        <p className="text-fg-muted">
          Every plan has a hosted checkout page at <code className="font-mono text-sm">/pay/&lt;planId&gt;</code>. Create a
          plan on the merchant dashboard, copy its link and send it to customers or put it on your pricing page. The
          checkout handles the wallet connection, the token allowance and the subscribe call.
        </p>
      </Section>

      <Section id="button" title="2. Add a Subscribe with Stellar button">
        <p className="text-fg-muted">
          Paste this anywhere HTML is allowed. It&apos;s an ordinary link with inline styles, so it doesn&apos;t load
          scripts and won&apos;t clash with your CSS. Replace the domain with wherever you host this app, and the plan number with your own.
        </p>
        <CodeBlock label="Button HTML" code={subscribeButtonHtml("https://your-lumensub-app.example", "1")} />
      </Section>

      <Section id="sdk" title="3. Build transactions with the SDK">
        <p className="text-fg-muted">
          <code className="font-mono text-sm">@lumensub/sdk</code> builds and simulates contract calls and leaves signing
          to you, so it works with browser wallets and server-side keys alike. Amounts are bigints in the token&apos;s
          base units, which for Stellar assets means seven decimal places.
        </p>
        <CodeBlock label="SDK example" code={sdkExample} />
      </Section>

      <Section id="webhooks" title="Webhooks">
        <p className="text-fg-muted">
          Add an endpoint under Webhooks on the dashboard. Each delivery is a JSON POST with a{" "}
          <code className="font-mono text-sm">LumenSub-Signature</code> header of the form{" "}
          <code className="font-mono text-sm">t=&lt;unix time&gt;,v1=&lt;hex&gt;</code>. The{" "}
          <code className="font-mono text-sm">v1</code> value is a hex HMAC-SHA256 of the timestamp, a dot and the raw
          body, keyed with your signing secret. Check it against the raw bytes before parsing, reject timestamps more
          than five minutes off, and compare in constant time.
        </p>
        <CodeBlock label="Signature check" code={webhookExample} />
        <p className="text-sm text-fg-muted">
          Deliveries are retried with backoff when your endpoint returns an error, so handle each event id idempotently.
        </p>
      </Section>

      <Section id="lifecycle" title="Subscription states">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="font-medium">Trialing</dt>
          <dd className="text-fg-muted">Started with a free trial. The first charge happens when the trial ends.</dd>
          <dt className="font-medium">Active</dt>
          <dd className="text-fg-muted">Paid up. The next charge is due at the end of the current period.</dd>
          <dt className="font-medium">PastDue</dt>
          <dd className="text-fg-muted">A charge failed. It is retried until the plan&apos;s grace period runs out.</dd>
          <dt className="font-medium">Paused</dt>
          <dd className="text-fg-muted">The subscriber paused it. No charges until they resume.</dd>
          <dt className="font-medium">Lapsed</dt>
          <dd className="text-fg-muted">The grace period ended without a successful charge.</dd>
          <dt className="font-medium">Cancelled / Completed</dt>
          <dd className="text-fg-muted">Ended by the subscriber, or every payment of a fixed-length plan was made.</dd>
        </dl>
      </Section>
    </article>
  );
}
