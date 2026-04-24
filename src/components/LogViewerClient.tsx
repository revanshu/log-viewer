"use client";

import {useMemo } from "react";
import type { NormalizedLogEntry } from "@/lib/otlp";
import { applyLogFilters } from "@/lib/filters";
import { useLogFilterStore } from "@/lib/logFilterStore";
import { FilterBar } from "@/components/FilterBar";
import { Histogram } from "@/components/Histogram";
import { LogListVirtual } from "@/components/LogListVirtual";

export function LogViewerClient({ entries }: { entries: NormalizedLogEntry[] }) {
  const q = useLogFilterStore((state) => state.q);
  const groupByService = useLogFilterStore((state) => state.groupByService);
  const startMs = useLogFilterStore((state) => state.startMs);
  const endMs = useLogFilterStore((state) => state.endMs);

  const params = useMemo(
    () => ({ q, groupByService, startMs, endMs }),
    [q, groupByService, startMs, endMs]
  );

  const filtered = useMemo(() => applyLogFilters(entries, params), [entries, params]);

  return (
    <div className="flex min-h-screen flex-col">
      <FilterBar />
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

