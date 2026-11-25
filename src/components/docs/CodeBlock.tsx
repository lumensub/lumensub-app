"use client";

import { useState } from "react";

export function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // selection still works
    }
  }

  return (
    <div className="relative">
      <pre
        aria-label={label}
        className="overflow-x-auto rounded-lg border border-border bg-muted px-4 py-3 font-mono text-xs leading-relaxed"
      >
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 rounded-md border border-border bg-surface px-2 py-1 text-xs hover:bg-muted"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
