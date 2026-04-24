"use client";

import { useMemo } from "react";
import { useLogFilterStore } from "@/lib/logFilterStore";

export function FilterBar() {
  const groupByService = useLogFilterStore((state) => state.groupByService);
  const q = useLogFilterStore((state) => state.q ?? "");
  const setQ = useLogFilterStore((state) => state.setQ);
  const setGroupByService = useLogFilterStore((state) => state.setGroupByService);
  const clear = useLogFilterStore((state) => state.clear);

  const trimmedQ = useMemo(() => q.trim(), [q]);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
      <button
        type="button"
        className={`rounded border px-3 py-1 text-sm ${
          groupByService ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-900"
        }`}
        onClick={() => setGroupByService(!groupByService)}
        aria-pressed={groupByService}
      >
        Group by Service
      </button>

      <div className="flex items-center gap-2">
        <input
          className="w-[min(520px,80vw)] rounded border border-slate-300 px-3 py-1 text-sm font-mono"
          placeholder="Search (service, severity, body, attributes)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            setQ(trimmedQ);
          }}
        />
        <button
          type="button"
          className="rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900"
          onClick={() => setQ(trimmedQ)}
        >
          Apply
        </button>
        <button
          type="button"
          className="rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900"
          onClick={() => {
            setQ("");
            clear();
          }}
        >
          Clear
        </button>
      </div>

      <div className="ml-auto text-xs text-slate-500">{null}</div>
    </div>
  );
}

