import type { NormalizedLogEntry } from "@/lib/otlp";
import { orderedSeverityLevels, severityLevelForEntry, type SeverityLevel } from "@/lib/severity";

export type SeverityCounts = Record<SeverityLevel, number>;

export type TimeBucket = { t: number; total: number } & SeverityCounts;

function emptySeverityCounts(): SeverityCounts {
  return Object.fromEntries(orderedSeverityLevels.map((l) => [l, 0])) as SeverityCounts;
}

export function bucketLogsByTime(entries: NormalizedLogEntry[], bucketMs: number): TimeBucket[] {
  if (entries.length === 0) return [];
  const counts = new Map<number, SeverityCounts>();

  for (const e of entries) {
    const t = Math.floor(e.tsMs / bucketMs) * bucketMs;
    const level = severityLevelForEntry(e);
    const curr =
      counts.get(t) ?? emptySeverityCounts();
    curr[level] += 1;
    counts.set(t, curr);
  }

  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, sev]) => {
      const total = orderedSeverityLevels.reduce((acc, k) => acc + sev[k], 0);
      return { t, total, ...sev };
    });
}

function startOfLocalDayMs(tsMs: number): number {
  const d = new Date(tsMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function bucketLogsByLocalDay(entries: NormalizedLogEntry[]): TimeBucket[] {
  if (entries.length === 0) return [];
  const counts = new Map<number, SeverityCounts>();

  for (const e of entries) {
    const t = startOfLocalDayMs(e.tsMs);
    const level = severityLevelForEntry(e);
    const curr = counts.get(t) ?? emptySeverityCounts();
    curr[level] += 1;
    counts.set(t, curr);
  }

  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, sev]) => {
      const total = orderedSeverityLevels.reduce((acc, k) => acc + sev[k], 0);
      return { t, total, ...sev };
    });
}

