# Security

## Reporting a vulnerability

Please don't open a public issue. Use GitHub's private reporting instead:
https://github.com/lumensub/lumensub-app/security/advisories/new

Include what you found, how to reproduce it and what you think the impact is. We'll acknowledge the report within three working days and keep you updated until it's resolved. If you'd like credit, we'll name you in the advisory.

## Scope

This repo covers the web app and `@lumensub/sdk`. Things we particularly care about:

- anything that could get a user to sign a transaction other than the one shown on screen
- leaks of the merchant API key or webhook signing secrets
- cross-site scripting, especially on the checkout page and in the embeddable button snippet
- allowance amounts or expiry ledgers that are larger than the UI says

Problems in the contract belong in `lumensub-contracts`, and problems in the API in `lumensub-backend`.

## How the app handles secrets

- The app never asks for or stores a secret key. All signing happens in the user's wallet.
- The merchant API key is kept in the browser's `localStorage` and sent only to the configured `NEXT_PUBLIC_API_URL`. Anyone with access to that browser profile can read it, so merchants should use a separate key per device and revoke keys they no longer need.
- Webhook signing secrets and new API keys are shown once, at creation, and never fetched again.

## Supported versions

Only the latest commit on `main` is supported while the project is pre-1.0.
