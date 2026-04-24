"use client";

import { create } from "zustand";
import type { LogFilterParams } from "./filters";

export type LogFilterState = LogFilterParams & {
  setQ: (q: string) => void;
  setGroupByService: (groupByService: boolean) => void;
  setStartMs: (startMs?: number) => void;
  setEndMs: (endMs?: number) => void;
  clear: () => void;
};

export const useLogFilterStore = create<LogFilterState>((set) => ({
  q: undefined,
  groupByService: false,
  startMs: undefined,
  endMs: undefined,
  setQ: (q) => set({ q: q.trim() || undefined }),
  setGroupByService: (groupByService) => set({ groupByService }),
  setStartMs: (startMs) => set({ startMs }),
  setEndMs: (endMs) => set({ endMs }),
  clear: () => set({ q: undefined, groupByService: false, startMs: undefined, endMs: undefined })
}));
