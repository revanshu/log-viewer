"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function setOrDelete(sp: URLSearchParams, key: string, value: string | null) {
  if (value === null || value === "") sp.delete(key);
  else sp.set(key, value);
}

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const groupByService = sp.get("groupByService") === "1" || sp.get("groupByService") === "true";
  const qFromUrl = sp.get("q") ?? "";

  const [q, setQ] = useState(qFromUrl);

  const canSync = useMemo(() => q !== qFromUrl, [q, qFromUrl]);

  function push(next: URLSearchParams) {
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
      <button
        type="button"
        className={`rounded border px-3 py-1 text-sm ${
          groupByService ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-900"
        }`}
        onClick={() => {
          const next = new URLSearchParams(sp);
          setOrDelete(next, "groupByService", groupByService ? null : "1");
          push(next);
        }}
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
            const next = new URLSearchParams(sp);
            setOrDelete(next, "q", q.trim() ? q.trim() : null);
            push(next);
          }}
        />
        <button
          type="button"
          className="rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 disabled:opacity-50"
          disabled={!canSync || isPending}
          onClick={() => {
            const next = new URLSearchParams(sp);
            setOrDelete(next, "q", q.trim() ? q.trim() : null);
            push(next);
          }}
        >
          Apply
        </button>
        <button
          type="button"
          className="rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900"
          onClick={() => {
            setQ("");
            const next = new URLSearchParams(sp);
            next.delete("q");
            next.delete("startMs");
            next.delete("endMs");
            push(next);
          }}
        >
          Clear
        </button>
      </div>

      <div className="ml-auto text-xs text-slate-500">{isPending ? "Updating…" : null}</div>
    </div>
  );
}

