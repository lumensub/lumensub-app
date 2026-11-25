# Architecture

This repo is the part of LumenSub people actually see. It talks to two things: the `subscription` contract on Soroban, and `lumensub-backend`, which indexes contract events and serves merchant data.

```
                 +--------------------+
 browser ------> |  lumensub-app      |
 (Freighter)     |  Next.js + SDK     |
                 +----+----------+----+
                      |          |
          signed txs  |          |  REST /v1 (API key)
                      v          v
          +-------------+   +-----------------+
          | Soroban RPC |   | lumensub-backend|
          +------+------+   +--------+--------+
                 |                   |
                 v                   | reads events
          +--------------+           |
          | subscription | <---------+
          |   contract   |
          +--------------+
```

## Who is the source of truth

The contract is. Plan prices, billing periods and subscription status all live on chain, and every state change is a transaction the user signs.

The backend is a convenience layer. It stores what the chain can't hold cheaply, such as plan names, descriptions, webhook endpoints and API keys. It also turns contract events into the lists and charts the dashboard shows. If the backend is down, checkout still works, because `loadCheckoutPlan` reads the plan from the contract directly. The dashboard and the portal show a warning and whatever they can.

## Layout

```
sdk/                  @lumensub/sdk: tx builders, decoders, formatting
src/app/              routes (App Router)
  page.tsx            landing page
  merchant/           merchant dashboard
  pay/[planId]/       hosted checkout
  account/            subscriber portal
  docs/               integration guide
src/components/
  ui/                 buttons, cards, fields, tabs and other primitives
  layout/             header and footer
  wallet/             Freighter context and connect button
  merchant/           dashboard sections
  checkout/           checkout flow
  account/            subscription cards and receipts
src/lib/
  api/                typed client for the backend, with zod schemas
  chain.ts            shared SDK client and the useTransaction hook
  config.ts           validated NEXT_PUBLIC_* settings
  wallet.ts           Freighter wrapper
src/i18n/             message catalogue and locale provider
```

## How a write works

Every on-chain action goes through `useTransaction` in `src/lib/chain.ts`:

1. **Build.** The SDK fetches the account, adds the contract call and runs `prepareTransaction`, which simulates it and fills in the resource fees.
2. **Sign.** The wallet provider checks that Freighter is on the configured network, then asks it to sign.
3. **Submit.** The SDK sends the transaction and polls until it succeeds or fails.

The hook exposes the current step, so the UI can tell people they're waiting on their wallet rather than showing a generic spinner.

## Amounts

Token amounts are `bigint` in base units everywhere in code, and decimal strings in JSON. They're only turned into human text at the edge, by `formatAmount`. Nothing goes through floating point except the revenue chart, which needs numbers to draw.

## Styling

Tailwind with colour tokens defined as CSS variables in `globals.css`. Dark mode swaps the variables under a `.dark` class on `<html>`. A small inline script sets that class before first paint, so the page never flashes the wrong theme.
