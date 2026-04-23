"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { NormalizedLogEntry } from "@/lib/otlp";
import { severityColor, severityLevelForEntry } from "@/lib/severity";

type HeaderItem = { kind: "header"; serviceName: string; count: number; isCollapsed: boolean };
type LogItem = { kind: "log"; entry: NormalizedLogEntry };
type RowItem = HeaderItem | LogItem;

const timeFmt = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  fractionalSecondDigits: 3,
  timeZoneName: "short"
});

function fmtTime(tsMs: number) {
  return timeFmt.format(new Date(tsMs));
}

function buildItems(
  entries: NormalizedLogEntry[],
  groupByService: boolean,
  openService: string | null
): RowItem[] {
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
    const isCollapsed = openService === null ? true : openService !== serviceName;
    out.push({ kind: "header", serviceName, count: serviceEntries.length, isCollapsed });
    if (!isCollapsed) {
      for (const entry of serviceEntries) out.push({ kind: "log", entry });
    }
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openService, setOpenService] = useState<string | null>(null);

  // Default: when grouped, collapse all service groups.
  useEffect(() => {
    if (!groupByService) {
      setOpenService(null);
      return;
    }
    setOpenService(null);
    setExpandedId(null);
  }, [entries, groupByService]);

  const items = useMemo(
    () => buildItems(entries, groupByService, openService),
    [entries, groupByService, openService]
  );
  const idToIndex = useMemo(() => {
    const map = new Map<string, number>();
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      if (it?.kind === "log") map.set(it.entry.id, idx);
    }
    return map;
  }, [items]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    getItemKey: (index) => {
      const it = items[index];
      if (!it) return index;
      return it.kind === "header" ? `h-${it.serviceName}` : it.entry.id;
    },
    estimateSize: (index) => (items[index]?.kind === "header" ? 34 : 54),
    overscan: 10,
    measureElement: (el) => el.getBoundingClientRect().height
  });

  useLayoutEffect(() => {
    // When groups collapse/expand, the rendered item set changes.
    // Re-measure after commit so cached sizes don't drift.
    virtualizer.measure();
  }, [openService, items.length, virtualizer]);

  const measureIndex = useCallback(
    (idx: number | undefined) => {
      if (idx === undefined) return;
      const parent = parentRef.current;
      if (!parent) return;
      const el = parent.querySelector<HTMLElement>(`[data-index="${idx}"]`);
      if (!el) return;
      virtualizer.measureElement(el);
    },
    [virtualizer]
  );

  const toggle = useCallback(
    (id: string) => {
      const prevId = expandedId;
      const nextId = prevId === id ? null : id;
      setExpandedId(nextId);

      // Re-measure only the affected row(s) after DOM updates.
      const nextIdx = nextId ? idToIndex.get(nextId) : undefined;
      const prevIdx = prevId ? idToIndex.get(prevId) : undefined;
      requestAnimationFrame(() => {
        measureIndex(prevIdx);
        measureIndex(nextIdx);
      });
    },
    [expandedId, idToIndex, measureIndex]
  );

  const toggleService = useCallback(
    (serviceName: string) => {
      setOpenService((prev) => (prev === serviceName ? null : serviceName));
      setExpandedId(null);
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

      <div
        ref={parentRef}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-scroll"
        style={{ scrollbarGutter: "stable" }}
      >
        <div className="relative w-full" style={{ height: total }}>
          {virtualItems.map((vi) => {
            const item = items[vi.index];
            if (!item) return null;

            return (
              <div
                key={item.kind === "header" ? `h-${item.serviceName}` : item.entry.id}
                data-index={vi.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 top-0 w-full"
                style={{ transform: `translateY(${vi.start}px)` }}
              >
                {item.kind === "header" ? (
                  <button
                    type="button"
                    onClick={() => toggleService(item.serviceName)}
                    className="flex w-full items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-900"
                  >
                    <span className="w-4 text-slate-500">{item.isCollapsed ? "▸" : "▾"}</span>
                    <span className="font-mono">{item.serviceName}</span>
                    <span className="text-xs font-normal text-slate-500">({item.count})</span>
                  </button>
                ) : (
                  <LogRow entry={item.entry} isExpanded={expandedId === item.entry.id} onToggle={toggle} />
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
  const level = severityLevelForEntry(entry);
  const sevLabel =
    entry.severityText ??
    (entry.severityNumber !== null ? `${level} (${entry.severityNumber})` : level);
  const time = fmtTime(entry.tsMs);
  const c = severityColor(level);

  return (
    <div className="box-border flex w-full flex-col gap-2 border-b border-slate-200 px-3 py-2">
      <button
        type="button"
        className="grid w-full grid-cols-[140px_240px_1fr] items-start gap-3 text-left box-border"
        onClick={() => onToggle(entry.id)}
      >
        <div className="flex items-center">
          <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-mono ${c.bg} ${c.text}`}>
            {sevLabel}
          </span>
        </div>
        <div className="text-xs font-mono text-slate-700">{time}</div>
        <div className="min-w-0 text-xs font-mono text-slate-900">
          <div className="truncate">{entry.body || "—"}</div>
        </div>
      </button>

      {isExpanded ? (
        <div className="box-border w-full min-w-0 max-w-full rounded border border-slate-200 bg-slate-50 p-2">
          <div className="text-[11px] font-semibold text-slate-600">Attributes</div>
          <pre className="mt-1 w-full min-w-0 max-w-full max-h-72 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words text-xs font-mono text-slate-900">
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

