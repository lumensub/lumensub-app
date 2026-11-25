# @lumensub/sdk

A small TypeScript library for building and reading LumenSub contract calls. It lives in `sdk/` and is what the app uses, but nothing in it depends on React or the browser.

It never signs anything. You get back an unsigned, simulated transaction as base64 XDR. You sign it with whatever holds the key (Freighter, a hardware wallet, a server keypair) and pass the result to `submit`.

## Setup

```ts
import { LumenSubClient, NETWORKS } from "@lumensub/sdk";

const lumensub = new LumenSubClient({
  rpcUrl: NETWORKS.testnet.rpcUrl,
  networkPassphrase: NETWORKS.testnet.passphrase,
  contractId: "C...",
});
```

`@stellar/stellar-sdk` (v13 or later) is a peer dependency.

## Writes

Each method returns a prepared XDR string.

| Method | Contract call | Signed by |
| --- | --- | --- |
| `buildCreatePlan(merchant, params)` | `create_plan` | merchant |
| `buildSetPlanActive(merchant, planId, active)` | `set_plan_active` | merchant |
| `buildApprove(token, from, amount, expirationLedger)` | token `approve` | subscriber |
| `buildSubscribe(subscriber, planId)` | `subscribe` | subscriber |
| `buildPause` / `buildResume` / `buildCancel(subscriber, subId)` | `pause` / `resume` / `cancel` | subscriber |
| `buildChangePlan(subscriber, subId, newPlanId)` | `change_plan` | subscriber |
| `buildCharge(keeper, subId)` | `charge` | anyone |
| `buildRefund(merchant, subId, amount)` | `refund` | merchant |

A subscriber has to approve the contract as a spender before `subscribe` will succeed. `approvalExpirationLedger(periodSecs, cycles)` picks an expiry that covers that many billing periods, capped at what the network allows.

```ts
const expiration = await lumensub.approvalExpirationLedger(plan.periodSecs, 12);
const approveXdr = await lumensub.buildApprove(plan.token, me, plan.amount * 12n, expiration);
await lumensub.submit(await sign(approveXdr));

const subscribeXdr = await lumensub.buildSubscribe(me, plan.id);
const { returnValue: subscriptionId } = await lumensub.submit(await sign(subscribeXdr));
```

## Reads

`getPlan(id)`, `getSubscription(id)`, `isDue(id)` and `getConfig()` run through simulation, so they're free and don't need a funded account.

## Helpers

- `toBaseUnits("9.99")` gives `99900000n`. It throws on bad input or too many decimals instead of rounding.
- `fromBaseUnits(99900000n)` gives `"9.99"`.
- `formatAmount(99900000n, "USDC")` gives `"9.99 USDC"`.
- `formatPeriod(2592000n)` gives `"monthly"`.
- `shortenAddress("GABC...XYZ")` keeps the first and last four characters.

## Errors

Failures throw `LumenSubError`. The `detail` field holds the raw simulation or transaction result when there is one, which is usually what you need for debugging.

## Building

```sh
cd sdk
npx tsc -p tsconfig.json
```

The package isn't published to npm yet. Until it is, import it from this repo through a path alias, as the app does.
