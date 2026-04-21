"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { NormalizedLogEntry } from "@/lib/otlp";

type HeaderItem = { kind: "header"; serviceName: string; count: number };
type LogItem = { kind: "log"; entry: NormalizedLogEntry };
type RowItem = HeaderItem | LogItem;

const timeFmt = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  fractionalSecondDigits: 3
});

function fmtTime(tsMs: number) {
  return timeFmt.format(new Date(tsMs));
}

function buildItems(entries: NormalizedLogEntry[], groupByService: boolean): RowItem[] {
  if (!groupByService) return entries.map((entry) => ({ kind: "log", entry }));

  const map = new Map<string, NormalizedLogEntry[]>();
  for (const e of entries) {
    const key = e.serviceName ?? "unknown";
    const arr = map.get(key);
    if (arr) arr.push(e);
    else map.set(key, [e]);
  }

  const services = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const out: RowItem[] = [];
  for (const [serviceName, serviceEntries] of services) {
    out.push({ kind: "header", serviceName, count: serviceEntries.length });
    for (const entry of serviceEntries) out.push({ kind: "log", entry });
  }
  return out;
}

export function LogListVirtual({
  entries,
  groupByService
}: {
  entries: NormalizedLogEntry[];
  groupByService: boolean;
}) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(() => new Set<string>());

  const items = useMemo(() => buildItems(entries, groupByService), [entries, groupByService]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (items[index]?.kind === "header" ? 34 : 54),
    overscan: 10,
    measureElement: (el) => el.getBoundingClientRect().height
  });

  const toggle = useCallback(
    (id: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      // Expansion changes row height; force a re-measure after DOM update.
      requestAnimationFrame(() => virtualizer.measure());
    },
    [virtualizer]
  );

  const total = virtualizer.getTotalSize();
  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid grid-cols-[140px_240px_1fr] gap-3 border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
        <div>Severity</div>
        <div>Time</div>
        <div>Body</div>
      </div>

      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
        <div className="relative w-full" style={{ height: total }}>
          {virtualItems.map((vi) => {
            const item = items[vi.index];
            if (!item) return null;

            return (
              <div
                key={vi.key}
                data-index={vi.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 top-0 w-full"
                style={{ transform: `translateY(${vi.start}px)` }}
              >
                {item.kind === "header" ? (
                  <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                    <span className="font-mono">{item.serviceName}</span>
                    <span className="ml-2 text-xs font-normal text-slate-500">({item.count})</span>
                  </div>
                ) : (
                  <LogRow entry={item.entry} isExpanded={expanded.has(item.entry.id)} onToggle={toggle} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const LogRow = memo(function LogRow({
  entry,
  isExpanded,
  onToggle
}: {
  entry: NormalizedLogEntry;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}) {
  const sev = entry.severityText ?? (entry.severityNumber !== null ? String(entry.severityNumber) : "—");
  const time = fmtTime(entry.tsMs);

  return (
    <div className="px-3 py-2">
      <button
        type="button"
        className="grid w-full grid-cols-[140px_240px_1fr] items-start gap-3 text-left"
        onClick={() => onToggle(entry.id)}
      >
        <div className="text-xs font-mono text-slate-700">{sev}</div>
        <div className="text-xs font-mono text-slate-700">{time}</div>
        <div className="min-w-0 text-xs font-mono text-slate-900">
          <div className="truncate">{entry.body || "—"}</div>
        </div>
      </button>

      {isExpanded ? (
        <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-2">
          <div className="text-[11px] font-semibold text-slate-600">Attributes</div>
          <pre className="mt-1 overflow-auto text-xs font-mono text-slate-900">
            {JSON.stringify(
              {
                serviceName: entry.serviceName,
                severityText: entry.severityText,
                severityNumber: entry.severityNumber,
                tsMs: entry.tsMs,
                body: entry.body,
                attributes: entry.attributes,
                resourceAttributes: entry.raw.resourceAttributes,
                traceId: entry.raw.record.traceId,
                spanId: entry.raw.record.spanId
              },
              null,
              2
            )}
          </pre>
        </div>
      ) : null}
    </div>
  );
});

