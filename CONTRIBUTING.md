# Contributing

Thanks for taking the time. This guide covers the practical bits. If something in it is out of date, a PR that fixes it is very welcome.

## Getting set up

You'll need Node 18.18 or newer (20 is what CI uses) and the Freighter extension if you want to test anything that signs.

```sh
git clone https://github.com/<you>/lumensub-app.git
cd lumensub-app
npm install
cp .env.example .env.local
npm run dev
```

Pages that only read from the backend need `NEXT_PUBLIC_API_URL` to point at a running `lumensub-backend`. Anything that touches the chain needs `NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_ID` as well. Without them the app still runs and shows empty states, which is fine for most UI work.

## Before you open a PR

Run the same checks CI runs:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Then:

- **Keep it focused.** One issue per PR is easiest to review. If you spot something unrelated, open an issue or a separate PR.
- **Link the issue.** Put `Closes #123` in the description.
- **Show UI changes.** Add before and after screenshots, in light and dark mode if colours changed.
- **Write tests for logic.** Anything in `sdk/`, `src/lib/` or a pure helper next to a component should have tests. Component tests are welcome but not required for purely visual changes.

## Code style

- **Language:** TypeScript, strict mode. Avoid `any`. If you need an escape hatch, `unknown` plus a check is usually better.
- **Amounts:** token amounts stay as `bigint` in base units until they're displayed. Don't convert them to `number`.
- **Copy:** UI strings go in `src/i18n/messages.ts` when they're shared or appear in navigation. Write them the way you'd say them to someone: short, specific, no exclamation marks.
- **Accessibility:** every input needs a label, everything clickable has to work with a keyboard, and focus states must stay visible. The `Field`, `Button` and `Tabs` components handle most of this for you.
- **Formatting:** Prettier defaults with a 120 character line width. Most editors will pick that up from the existing code.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/): `feat(checkout): ...`, `fix(sdk): ...`, `docs: ...`, `test: ...`. Write the subject in the imperative ("add", not "added").

## Good first issues

Issues labelled `good first issue` are small and self-contained, and the description should be enough to start without asking. Comment on the issue before you start so two people don't do the same work.

## Questions

Open a discussion or comment on the issue you're working on. There's no such thing as a silly question about setup.
