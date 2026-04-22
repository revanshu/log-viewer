import type { NormalizedLogEntry } from "@/lib/otlp";

// OpenTelemetry severityNumber mapping:
// 1-4 TRACE, 5-8 DEBUG, 9-12 INFO, 13-16 WARN, 17-20 ERROR, 21-24 FATAL
export type SeverityLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL" | "UNSPECIFIED";

export function severityLevelFromNumber(n: number | null | undefined): SeverityLevel {
  if (n === null || n === undefined) return "UNSPECIFIED";
  if (n >= 1 && n <= 4) return "TRACE";
  if (n >= 5 && n <= 8) return "DEBUG";
  if (n >= 9 && n <= 12) return "INFO";
  if (n >= 13 && n <= 16) return "WARN";
  if (n >= 17 && n <= 20) return "ERROR";
  if (n >= 21 && n <= 24) return "FATAL";
  return "UNSPECIFIED";
}

export function severityLevelForEntry(e: NormalizedLogEntry): SeverityLevel {
  // Prefer numeric mapping when present; fallback to text.
  const fromNum = severityLevelFromNumber(e.severityNumber);
  if (fromNum !== "UNSPECIFIED") return fromNum;

  const t = (e.severityText ?? "").toUpperCase();
  if (t.includes("FATAL")) return "FATAL";
  if (t.includes("ERROR")) return "ERROR";
  if (t.includes("WARN")) return "WARN";
  if (t.includes("INFO")) return "INFO";
  if (t.includes("DEBUG")) return "DEBUG";
  if (t.includes("TRACE")) return "TRACE";
  return "UNSPECIFIED";
}

export function severityColor(level: SeverityLevel): { bg: string; text: string; fill: string; stroke: string } {
  // Tailwind-friendly palette; "fill/stroke" for recharts, "bg/text" for badges.
  switch (level) {
    case "FATAL":
      return { bg: "bg-red-200", text: "text-red-950", fill: "#ef4444", stroke: "#450a0a" };
    case "ERROR":
      return { bg: "bg-red-100", text: "text-red-900", fill: "#fca5a5", stroke: "#7f1d1d" };
    case "WARN":
      return { bg: "bg-amber-100", text: "text-amber-900", fill: "#fcd34d", stroke: "#78350f" };
    case "INFO":
      return { bg: "bg-blue-100", text: "text-blue-900", fill: "#93c5fd", stroke: "#1e3a8a" };
    case "DEBUG":
      return { bg: "bg-slate-100", text: "text-slate-900", fill: "#cbd5e1", stroke: "#0f172a" };
    case "TRACE":
      return { bg: "bg-emerald-100", text: "text-emerald-900", fill: "#6ee7b7", stroke: "#064e3b" };
    default:
      return { bg: "bg-slate-50", text: "text-slate-700", fill: "#e2e8f0", stroke: "#334155" };
  }
}

export const orderedSeverityLevels: SeverityLevel[] = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL", "UNSPECIFIED"];

