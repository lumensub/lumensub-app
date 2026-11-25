"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";

/** Show a one-time secret with a copy button and a clear warning. */
export function SecretReveal({ title, secret, onDone }: { title: string; secret: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
    } catch {
      // the value is selectable, so copying by hand still works
    }
  }

  return (
    <Alert tone="warning" title={title}>
      <p>This is the only time it will be shown. Store it somewhere safe before closing this message.</p>
      <code className="mt-3 block select-all break-all rounded-md bg-muted px-3 py-2 font-mono text-xs text-fg">{secret}</code>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="secondary" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          I&apos;ve saved it
        </Button>
      </div>
    </Alert>
  );
}
