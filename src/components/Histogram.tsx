"use client";

import { useMemo } from "react";
import type { NormalizedLogEntry } from "@/lib/otlp";
import { bucketLogsByTime } from "@/lib/bucketing";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const dtf = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  day: "2-digit"
});

function fmt(t: number) {
  return dtf.format(new Date(t));
}

export function Histogram({
  entries,
  bucketMs = 5 * 60 * 1000
}: {
  entries: NormalizedLogEntry[];
  bucketMs?: number;
}) {
  const data = useMemo(() => bucketLogsByTime(entries, bucketMs), [entries, bucketMs]);

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={fmt}
            tick={{ fontSize: 11, fill: "#475569" }}
            tickMargin={6}
            minTickGap={24}
          />
          <YAxis tick={{ fontSize: 11, fill: "#475569" }} width={36} />
          <Tooltip
            labelFormatter={(label) => fmt(Number(label))}
            formatter={(value) => [value, "count"]}
            contentStyle={{ fontSize: 12, borderRadius: 6 }}
          />
          <Area type="monotone" dataKey="count" stroke="#0f172a" fill="#cbd5e1" strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

