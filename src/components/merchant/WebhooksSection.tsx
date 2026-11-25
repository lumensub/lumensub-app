"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Alert, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { InputField } from "@/components/ui/Field";
import { api, WEBHOOK_EVENTS } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { SecretReveal } from "./SecretReveal";

export function isAllowedWebhookUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
    // Plain http is only useful for local testing.
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

export function WebhooksSection() {
  const hooks = useAsync(() => api.listWebhooks(), []);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["charge.succeeded", "charge.failed"]);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  function toggleEvent(name: string) {
    setEvents((current) => (current.includes(name) ? current.filter((e) => e !== name) : [...current, name]));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!isAllowedWebhookUrl(url.trim())) {
      setError("Use an https:// URL. Plain http is only allowed for localhost.");
      return;
    }
    if (events.length === 0) {
      setError("Pick at least one event.");
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      const created = await api.createWebhook({ url: url.trim(), events });
      setSecret(created.secret);
      setUrl("");
      hooks.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add the webhook.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await api.deleteWebhook(id).catch(() => undefined);
    hooks.reload();
  }

  return (
    <Card>
      <CardHeader
        title="Webhooks"
        description="We POST a signed JSON event to each endpoint. Verify the LumenSub-Signature header with your signing secret."
      />
      <CardBody className="space-y-5 border-b border-border">
        {secret && <SecretReveal title="Signing secret" secret={secret} onDone={() => setSecret(null)} />}
        <form onSubmit={submit} className="space-y-4" noValidate>
          <InputField
            label="Endpoint URL"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/webhooks/lumensub"
            error={error}
          />
          <fieldset>
            <legend className="text-sm font-medium">Events</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {WEBHOOK_EVENTS.map((name) => (
                <label key={name} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={events.includes(name)}
                    onChange={() => toggleEvent(name)}
                    className="h-4 w-4 rounded border-border accent-[rgb(var(--accent))]"
                  />
                  <span className="font-mono text-xs">{name}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit" loading={saving}>
            Add endpoint
          </Button>
        </form>
      </CardBody>

      {hooks.loading && (
        <CardBody>
          <Skeleton className="h-10" />
        </CardBody>
      )}
      {hooks.error && (
        <CardBody>
          <Alert tone="warning" title="Couldn't load webhooks">
            {hooks.error.message}
          </Alert>
        </CardBody>
      )}
      {hooks.data?.length === 0 && <EmptyState title="No endpoints yet" />}
      {hooks.data && hooks.data.length > 0 && (
        <ul className="divide-y divide-border">
          {hooks.data.map((hook) => (
            <li key={hook.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm">{hook.url}</p>
                <p className="mt-1 text-xs text-fg-muted">
                  {hook.events.join(", ")} &middot; added {formatDate(hook.createdAt)}
                </p>
              </div>
              <Button variant="danger" size="sm" onClick={() => remove(hook.id)} aria-label={`Remove ${hook.url}`}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
