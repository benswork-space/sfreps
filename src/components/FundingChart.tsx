"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { IndustryFunding } from "@/lib/types";
import { formatMoney } from "@/lib/format";

const COLORS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#14b8a6",
];

interface Props {
  industries: IndustryFunding[];
}

export default function FundingChart({ industries }: Props) {
  if (industries.length === 0) return null;

  const data = industries.slice(0, 10).map((ind) => ({
    name: ind.industry,
    amount: ind.amount,
    fullName: ind.industry,
    pct: ind.percentage,
  }));

  const chartHeight = Math.max(200, data.length * 36);

  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <XAxis
            type="number"
            tickFormatter={(v) => formatMoney(v)}
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={210}
            tick={{ fontSize: 12, fill: "#3f3f46" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [formatMoney(Number(value)), "Total"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e4e4e7",
              fontSize: "13px",
            }}
          />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={22}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
