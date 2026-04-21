import { normalizeOtlpLogsResponse } from "@/lib/otlp";
import { LogViewerClient } from "@/components/LogViewerClient";

export const dynamic = "force-dynamic";

async function fetchLogs() {
  const res = await fetch("https://take-home-assignment-otlp-logs-api.vercel.app/api/logs", {
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`Failed to fetch logs (${res.status})`);
  return res.json();
}

export default async function HomePage() {
  const raw = await fetchLogs();
  const entries = normalizeOtlpLogsResponse(raw);

  return (
    <main className="h-dvh">
      <LogViewerClient entries={entries} />
    </main>
  );
}

