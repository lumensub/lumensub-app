"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { InputField, SelectField } from "@/components/ui/Field";
import { useWallet } from "@/components/wallet/WalletProvider";
import { api } from "@/lib/api";
import { getLumenSub, TX_STEP_LABEL, useTransaction } from "@/lib/chain";
import { defaultTokens } from "@/lib/tokens";
import { emptyPlanForm, parsePlanForm, PERIOD_OPTIONS, type PlanFormErrors, type PlanFormValues } from "./planForm";

const CUSTOM_TOKEN = "custom";

export function CreatePlanForm({ onCreated }: { onCreated: (planId: string) => void }) {
  const tokens = useMemo(() => defaultTokens(), []);
  const [values, setValues] = useState<PlanFormValues>(() => emptyPlanForm(tokens[0].contractId));
  const [tokenChoice, setTokenChoice] = useState(tokens[0].contractId);
  const [errors, setErrors] = useState<PlanFormErrors>({});
  const { address, connect } = useWallet();
  const tx = useTransaction();

  const set = (field: keyof PlanFormValues) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parsePlanForm(values);
    if ("errors" in parsed) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});

    const merchant = address ?? (await connect());
    if (!merchant) return;

    // create_plan fails with MerchantNotFound until the wallet is registered. First-time
    // merchants sign once more here, with their own wallet as the payout address.
    const registered = await getLumenSub()
      ?.isMerchantRegistered(merchant)
      .catch(() => true);
    if (registered === false) {
      const registration = await tx.run((sdk) => sdk.buildRegisterMerchant(merchant, merchant));
      if (!registration) return;
    }

    const result = await tx.run((sdk) => sdk.buildCreatePlan(merchant, parsed.params));
    if (!result) return;

    const planId = String(result.returnValue ?? "");
    // The name lives off-chain. If saving it fails the plan still exists on chain,
    // so carry on rather than treating the whole thing as failed.
    if (parsed.name) await api.setPlanName(planId, parsed.name).catch(() => undefined);
    setValues(emptyPlanForm(tokenChoice === CUSTOM_TOKEN ? "" : tokenChoice));
    onCreated(planId);
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField label="Plan name" value={values.name} onChange={set("name")} error={errors.name} placeholder="Pro monthly" />

        <SelectField
          label="Asset"
          value={tokenChoice}
          onChange={(event) => {
            setTokenChoice(event.target.value);
            setValues((current) => ({ ...current, token: event.target.value === CUSTOM_TOKEN ? "" : event.target.value }));
          }}
        >
          {tokens.map((token) => (
            <option key={token.contractId} value={token.contractId}>
              {token.code}
            </option>
          ))}
          <option value={CUSTOM_TOKEN}>Other token (paste address)</option>
        </SelectField>
        {tokenChoice === CUSTOM_TOKEN ? (
          <InputField
            label="Token contract address"
            value={values.token}
            onChange={set("token")}
            error={errors.token}
            placeholder="C..."
            spellCheck={false}
            className="font-mono"
          />
        ) : (
          <InputField label="Price" inputMode="decimal" value={values.amount} onChange={set("amount")} error={errors.amount} placeholder="9.99" />
        )}
        {tokenChoice === CUSTOM_TOKEN && (
          <InputField label="Price" inputMode="decimal" value={values.amount} onChange={set("amount")} error={errors.amount} placeholder="9.99" />
        )}

        <SelectField label="Billing period" value={values.periodDays} onChange={set("periodDays")} error={errors.periodDays}>
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <InputField
          label="Free trial (days)"
          inputMode="numeric"
          value={values.trialDays}
          onChange={set("trialDays")}
          error={errors.trialDays}
        />
        <InputField
          label="Grace period (days)"
          inputMode="numeric"
          value={values.graceDays}
          onChange={set("graceDays")}
          error={errors.graceDays}
          hint="How long a failed payment can be retried before the subscription lapses."
        />
        <InputField
          label="Number of payments"
          inputMode="numeric"
          value={values.maxCycles}
          onChange={set("maxCycles")}
          error={errors.maxCycles}
          hint="0 means it renews until the subscriber cancels."
        />
      </div>

      {tx.error && <Alert tone="danger" title="The plan wasn't created">{tx.error}</Alert>}
      {tx.busy && <p className="text-sm text-fg-muted" role="status">{TX_STEP_LABEL[tx.step]}</p>}

      <p className="text-sm text-fg-muted">
        The first time you create a plan, Freighter asks you to sign twice: once to register this wallet as a merchant
        (payouts go to it), then once for the plan.
      </p>

      <Button type="submit" loading={tx.busy}>
        {address ? "Create plan" : "Connect wallet and create plan"}
      </Button>
    </form>
  );
}
