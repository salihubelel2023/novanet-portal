"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  Open: "hsl(var(--fiber))",
  "In progress": "hsl(var(--sky))",
  Resolved: "hsl(var(--signal))",
  Closed: "hsl(var(--muted-foreground))",
};

export function TicketStatusChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">No tickets yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "hsl(var(--muted))"} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 10,
            fontSize: 12,
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={32}
          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
