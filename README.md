# lumensub-app

The web front end for LumenSub, a way to run subscriptions on Stellar.

Merchants use it to create plans, share checkout links and keep an eye on revenue. Subscribers use it to sign up with their own wallet, then pause, switch or cancel whenever they want. Every one of those actions is a Soroban contract call the user signs, so nobody has to trust us with their funds or their card details.

This repo also contains `@lumensub/sdk`, the TypeScript library the app uses to talk to the contract. You can use it on its own.

## What's in here

| Route | What it does |
| --- | --- |
| `/` | Explains the product to someone who has never heard of it |
| `/merchant` | Revenue and churn, plans, subscribers, webhooks and API keys |
| `/pay/[planId]` | Hosted checkout: connect wallet, approve, subscribe |
| `/account` | Lists the connected wallet's subscriptions and lets you manage them |
| `/docs` | Integration guide with a copy-paste subscribe button |

The other two pieces of the project live in their own repos:

- [lumensub-contracts](https://github.com/lumensub/lumensub-contracts), the Soroban contracts
- [lumensub-backend](https://github.com/lumensub/lumensub-backend), the event indexer, billing scheduler and merchant API

## Running it locally

```sh
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000.

The app starts fine with an empty `.env.local`; pages just show empty states. To do anything real you need:

| Variable | What it's for |
| --- | --- |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` (default), `mainnet` or `futurenet` |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | RPC endpoint. Optional on testnet, required on mainnet |
| `NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_ID` | Deployed `subscription` contract, starts with `C` |
| `NEXT_PUBLIC_API_URL` | Where `lumensub-backend` is running |

You'll also want the [Freighter](https://www.freighter.app/) extension, set to the same network.

## Scripts

| Command | |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest, once |
| `npm run test:watch` | Vitest in watch mode |

## A few design decisions

**The contract is the source of truth.** The backend adds names, descriptions and history, but prices and terms come from the chain. If the API is down, checkout falls back to reading the plan from the contract, so a customer can still subscribe.

**Allowances are bounded.** Checkout never asks for an unlimited approval. Fixed-length plans approve their exact total, and open-ended ones approve twelve payments. The approval also expires.

**Amounts are bigints.** Token amounts stay in base units as `bigint` from the contract all the way to the screen, and are formatted only at the last moment.

**Signing stays in the wallet.** The SDK builds and simulates transactions but never sees a secret key.

More detail is in [docs/architecture.md](docs/architecture.md).

## Docs

- [Architecture](docs/architecture.md)
- [SDK reference](docs/sdk.md)
- [Hosted checkout guide](docs/checkout-integration.md)

## Contributing

Issues and pull requests are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) covers setup, checks and conventions. If you think you've found a security problem, please follow [SECURITY.md](SECURITY.md) instead of opening an issue.

## Status

Early and moving quickly. The app targets testnet and nothing here has been audited. Please don't point it at mainnet with real money yet.

## License

[MIT](LICENSE)
