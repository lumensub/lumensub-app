"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { InputField } from "@/components/ui/Field";
import { readApiKey, writeApiKey } from "@/lib/api";

/**
 * Merchant data comes from the backend and needs an API key. Ask for one
 * once, keep it in this browser only, and render children when it's set.
 */
export function ApiKeyGate({ children }: { children: (signOut: () => void) => ReactNode }) {
  const [key, setKey] = useState<string | undefined>();
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    setKey(readApiKey());
    setReady(true);
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = draft.trim();
    if (!/^lsk_[A-Za-z0-9_-]{8,}$/.test(value)) {
      setError("API keys start with lsk_ and are at least 12 characters long.");
      return;
    }
    writeApiKey(value);
    setKey(value);
    setDraft("");
    setError(undefined);
  }

  function signOut() {
    writeApiKey(null);
    setKey(undefined);
  }

  if (!ready) return null;
  if (key) return <>{children(signOut)}</>;

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader
        title="Connect your merchant account"
        description="Paste an API key from lumensub-backend. It stays in this browser and is sent only to your configured API."
      />
      <CardBody>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <InputField
            label="API key"
            type="password"
            autoComplete="off"
            placeholder="lsk_..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            error={error}
            hint="Create your first key with the backend's create-api-key script."
          />
          <Button type="submit">Continue</Button>
        </form>
      </CardBody>
    </Card>
  );
}
