import type { ReactNode } from "react";
import { Card } from "./Card";

interface StatProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}

export function Stat({ label, value, detail }: StatProps) {
  return (
    <Card className="px-5 py-4">
      <p className="text-sm text-fg-muted">{label}</p>
      <p className="tabular mt-2 text-2xl font-semibold">{value}</p>
      {detail && <p className="mt-1 text-xs text-fg-muted">{detail}</p>}
    </Card>
  );
}
