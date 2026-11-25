import type { SubscriptionStatus } from "@lumensub/sdk";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-muted text-fg-muted",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export const STATUS_TONE: Record<SubscriptionStatus, Tone> = {
  Trialing: "accent",
  Active: "success",
  PastDue: "warning",
  Paused: "neutral",
  Cancelled: "neutral",
  Lapsed: "danger",
  Completed: "neutral",
};
