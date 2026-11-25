"use client";

import { fromBaseUnits } from "@lumensub/sdk";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RevenuePoint } from "@/lib/api";

interface RevenueChartProps {
  points: RevenuePoint[];
  code?: string;
}

export function RevenueChart({ points, code = "" }: RevenueChartProps) {
  const data = points.map((point) => ({
    date: point.date.slice(5, 10),
    revenue: Number(fromBaseUnits(BigInt(point.revenue))),
  }));
  const total = data.reduce((sum, point) => sum + point.revenue, 0);

  return (
    <figure>
      <figcaption className="sr-only">
        Daily revenue over the last {data.length} days, {total.toFixed(2)} {code} in total.
      </figcaption>
      <div className="h-64" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.25} />
                <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgb(var(--border))" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} stroke="rgb(var(--fg-muted))" />
            <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} stroke="rgb(var(--fg-muted))" />
            <Tooltip
              contentStyle={{
                background: "rgb(var(--surface))",
                border: "1px solid rgb(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value} ${code}`.trim(), "Revenue"]}
            />
            <Area type="monotone" dataKey="revenue" stroke="rgb(var(--accent))" strokeWidth={2} fill="url(#revenueFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
