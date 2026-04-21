import type { NormalizedLogEntry } from "@/lib/otlp";

export type LogFilterParams = {
  q?: string;
  groupByService?: boolean;
  startMs?: number;
  endMs?: number;
};

export function parseLogFilterParams(sp: URLSearchParams): LogFilterParams {
  const q = sp.get("q")?.trim() ?? "";

  const groupByServiceRaw = sp.get("groupByService");
  const groupByService = groupByServiceRaw === "1" || groupByServiceRaw === "true";

  const startMsRaw = sp.get("startMs");
  const endMsRaw = sp.get("endMs");
  const startMs = startMsRaw ? Number(startMsRaw) : undefined;
  const endMs = endMsRaw ? Number(endMsRaw) : undefined;

  // Extendability note: adding `dateRange=...` is just another parse branch here
  // that sets startMs/endMs without changing downstream filtering/grouping.
  return {
    q: q || undefined,
    groupByService,
    startMs: Number.isFinite(startMs) ? startMs : undefined,
    endMs: Number.isFinite(endMs) ? endMs : undefined
  };
}

export function applyLogFilters(entries: NormalizedLogEntry[], params: LogFilterParams): NormalizedLogEntry[] {
  const q = params.q?.toLowerCase();
  const startMs = params.startMs;
  const endMs = params.endMs;

  if (!q && startMs === undefined && endMs === undefined) return entries;

  return entries.filter((e) => {
    if (startMs !== undefined && e.tsMs < startMs) return false;
    if (endMs !== undefined && e.tsMs > endMs) return false;

    if (q) {
      const haystack =
        `${e.serviceName ?? ""} ${e.severityText ?? ""} ${e.body} ` +
        `${Object.entries(e.attributes)
          .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
          .join(" ")}`;
      if (!haystack.toLowerCase().includes(q)) return false;
    }

    return true;
  });
}

export type GroupedLogs = Array<{
  serviceName: string;
  entries: NormalizedLogEntry[];
}>;

export function groupLogsByService(entries: NormalizedLogEntry[]): GroupedLogs {
  const map = new Map<string, NormalizedLogEntry[]>();
  for (const e of entries) {
    const key = e.serviceName ?? "unknown";
    const arr = map.get(key);
    if (arr) arr.push(e);
    else map.set(key, [e]);
  }
  return [...map.entries()]
    .map(([serviceName, groupedEntries]) => ({ serviceName, entries: groupedEntries }))
    .sort((a, b) => a.serviceName.localeCompare(b.serviceName));
}

