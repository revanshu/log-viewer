"use client";

import { useMemo } from "react";
import type { NormalizedLogEntry } from "@/lib/otlp";
import { bucketLogsByLocalDay, bucketLogsByTime } from "@/lib/bucketing";
import { orderedSeverityLevels, severityColor, type SeverityLevel } from "@/lib/severity";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const dayFmt = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZoneName: "short"
});

const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  day: "2-digit",
  timeZoneName: "short"
});

function fmt(t: number) {
  return timeFmt.format(new Date(t));
}

function fmtDay(t: number) {
  return dayFmt.format(new Date(t));
}

export function Histogram({
  entries,
  bucketMs = 24 * 60 * 60 * 1000
}: {
  entries: NormalizedLogEntry[];
  bucketMs?: number;
}) {
  const data = useMemo(() => {
    // For "1 day" view, align buckets to local midnight to avoid odd-looking day splits.
    if (bucketMs >= 24 * 60 * 60 * 1000) return bucketLogsByLocalDay(entries);
    return bucketLogsByTime(entries, bucketMs);
  }, [entries, bucketMs]);
  // Keep horizontal scroll minimal; scale far less aggressively.
  const chartMinWidth = Math.max(90, data.length * 7);

  return (
    <div className="w-full overflow-x-auto overflow-y-hidden">
      <div className="h-56" style={{ minWidth: chartMinWidth }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }} barCategoryGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="t"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={bucketMs >= 24 * 60 * 60 * 1000 ? fmtDay : fmt}
              tick={{ fontSize: 11, fill: "#475569" }}
              tickMargin={6}
              minTickGap={24}
            />
            <YAxis tick={{ fontSize: 11, fill: "#475569" }} width={36} />
            <Tooltip
              labelFormatter={(label) =>
                (bucketMs >= 24 * 60 * 60 * 1000 ? fmtDay : fmt)(Number(label))
              }
              formatter={(value, name) => [value, String(name)]}
              contentStyle={{ fontSize: 12, borderRadius: 6 }}
              wrapperStyle={{ pointerEvents: "none" }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => <span className="text-slate-700">{String(value)}</span>}
            />
            {orderedSeverityLevels
              .filter((l) => l !== "UNSPECIFIED")
              .map((level) => {
                const c = severityColor(level as SeverityLevel);
                return (
                  <Bar
                    key={level}
                    dataKey={level}
                    stackId="a"
                    fill={c.fill}
                    stroke={c.stroke}
                    isAnimationActive={false}
                    maxBarSize={46}
                  />
                );
              })}
            <Bar
              key="UNSPECIFIED"
              dataKey="UNSPECIFIED"
              stackId="a"
              fill={severityColor("UNSPECIFIED").fill}
              stroke={severityColor("UNSPECIFIED").stroke}
              isAnimationActive={false}
              maxBarSize={46}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

