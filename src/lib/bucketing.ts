import type { NormalizedLogEntry } from "@/lib/otlp";

export type TimeBucket = { t: number; count: number };

export function bucketLogsByTime(entries: NormalizedLogEntry[], bucketMs: number): TimeBucket[] {
  if (entries.length === 0) return [];
  const counts = new Map<number, number>();

  for (const e of entries) {
    const t = Math.floor(e.tsMs / bucketMs) * bucketMs;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, count]) => ({ t, count }));
}

