"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { NormalizedLogEntry } from "@/lib/otlp";
import { applyLogFilters, parseLogFilterParams } from "@/lib/filters";
import { FilterBar } from "@/components/FilterBar";
import { Histogram } from "@/components/Histogram";
import { LogListVirtual } from "@/components/LogListVirtual";

export function LogViewerClient({ entries }: { entries: NormalizedLogEntry[] }) {
  const sp = useSearchParams();

  const params = useMemo(() => parseLogFilterParams(new URLSearchParams(sp)), [sp]);
  const filtered = useMemo(() => applyLogFilters(entries, params), [entries, params]);

  return (
    <div className="flex h-dvh flex-col">
      <Suspense fallback={<div className="p-3 text-sm text-slate-500">Loading filters…</div>}>
        <FilterBar />
      </Suspense>
      <div className="border-b border-slate-200 p-3">
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <div className="text-sm font-semibold text-slate-900">Histogram</div>
          <div className="text-xs text-slate-500">
            Showing <span className="font-mono">{filtered.length}</span> /{" "}
            <span className="font-mono">{entries.length}</span>
          </div>
        </div>
        <Histogram entries={filtered} />
      </div>
      <LogListVirtual entries={filtered} groupByService={!!params.groupByService} />
    </div>
  );
}

