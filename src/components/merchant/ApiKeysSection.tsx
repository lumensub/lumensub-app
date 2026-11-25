"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Alert, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { InputField } from "@/components/ui/Field";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { SecretReveal } from "./SecretReveal";

export function ApiKeysSection({ onSignOut }: { onSignOut: () => void }) {
  const keys = useAsync(() => api.listApiKeys(), []);
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Name the key after where it will be used, like 'production server'.");
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      const result = await api.createApiKey({ name: name.trim() });
      setCreated(result.key);
      setName("");
      keys.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the key.");
    } finally {
      setSaving(false);
    }
  }

  async function revoke(id: string) {
    await api.deleteApiKey(id).catch(() => undefined);
    keys.reload();
  }

  return (
    <Card>
      <CardHeader
        title="API keys"
        description="Keys let your servers read subscription data. Revoke any key you no longer use."
        action={
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            Forget key in this browser
          </Button>
        }
      />
      <CardBody className="space-y-4 border-b border-border">
        {created && <SecretReveal title="New API key" secret={created} onDone={() => setCreated(null)} />}
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
          <div className="flex-1">
            <InputField label="Key name" value={name} onChange={(event) => setName(event.target.value)} error={error} />
          </div>
          <Button type="submit" loading={saving}>
            Create key
          </Button>
        </form>
      </CardBody>

      {keys.loading && (
        <CardBody>
          <Skeleton className="h-10" />
        </CardBody>
      )}
      {keys.error && (
        <CardBody>
          <Alert tone="warning" title="Couldn't load API keys">
            {keys.error.message}
          </Alert>
        </CardBody>
      )}
      {keys.data?.length === 0 && <EmptyState title="No keys yet" />}
      {keys.data && keys.data.length > 0 && (
        <ul className="divide-y divide-border">
          {keys.data.map((key) => (
            <li key={key.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium">{key.name}</p>
                <p className="mt-1 text-xs text-fg-muted">
                  <span className="font-mono">{key.prefix}...</span> &middot; created {formatDate(key.createdAt)}
                  {key.lastUsedAt && <> &middot; last used {formatDate(key.lastUsedAt)}</>}
                </p>
              </div>
              <Button variant="danger" size="sm" onClick={() => revoke(key.id)} aria-label={`Revoke ${key.name}`}>
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
