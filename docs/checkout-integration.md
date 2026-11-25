# Taking payments with the hosted checkout

Most merchants never need to write code. Create a plan, share its checkout link, and LumenSub handles the rest.

## The link

Every plan has a page at:

```
https://<where-you-host-this-app>/pay/<planId>
```

The page shows the plan's name, price, billing period, trial and length, then walks the customer through three steps:

1. **Connect wallet.** Freighter, on the network the app is configured for. If the wallet is on another network, the customer is asked to switch rather than sent off to sign something that will fail.
2. **Approve payments.** One token allowance. For a fixed-length plan it covers exactly the plan's total. For an open-ended plan it covers twelve payments. It is never an unlimited approval.
3. **Subscribe.** One contract call. If the plan has a trial, no money moves yet.

Afterwards the customer gets a link to the transaction and to their subscriptions page.

## The button

If you want a button on your own site, generate the snippet from the docs page or write it yourself. It's just a link:

```html
<a href="https://<where-you-host-this-app>/pay/1" target="_blank" rel="noopener">Subscribe with Stellar</a>
```

Style it however you like. Nothing in the flow depends on the button's markup.

## Archived plans

Archiving a plan (on the dashboard, or `set_plan_active(false)` on the contract) stops new checkouts. The checkout page says the plan isn't taking new subscribers. Existing subscriptions keep billing as normal.

## When the backend is down

Checkout reads the plan from the contract if the API can't be reached. The page then shows "Plan #3" instead of the plan's name, but price, period and terms all come from the chain, and subscribing works as usual.

## Testing on testnet

1. Install Freighter and switch it to Testnet.
2. Fund the account at https://lab.stellar.org/account/fund.
3. Create a plan priced in XLM on the dashboard. XLM is the easiest choice because every funded testnet account already holds it.
4. Open the checkout link in another browser profile with a second funded account, and subscribe.
