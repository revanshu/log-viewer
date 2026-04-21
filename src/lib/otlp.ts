export type OtlpAnyValue =
  | { stringValue: string }
  | { boolValue: boolean }
  | { intValue: string | number }
  | { doubleValue: number }
  | { bytesValue: string }
  | { arrayValue: { values?: OtlpAnyValue[] } }
  | { kvlistValue: { values?: OtlpKeyValue[] } }
  | Record<string, unknown>;

export type OtlpKeyValue = { key: string; value?: OtlpAnyValue };

export type OtlpLogRecord = {
  timeUnixNano?: string | number;
  observedTimeUnixNano?: string | number;
  severityText?: string;
  severityNumber?: number;
  body?: OtlpAnyValue;
  attributes?: OtlpKeyValue[];
  traceId?: string;
  spanId?: string;
};

export type OtlpScopeLogs = {
  scope?: { name?: string; version?: string };
  logRecords?: OtlpLogRecord[];
};

export type OtlpResourceLogs = {
  resource?: { attributes?: OtlpKeyValue[] };
  scopeLogs?: OtlpScopeLogs[];
};

export type OtlpLogsResponse = {
  resourceLogs?: OtlpResourceLogs[];
};

export type NormalizedLogEntry = {
  id: string;
  tsMs: number;
  serviceName: string | null;
  severityText: string | null;
  severityNumber: number | null;
  body: string;
  attributes: Record<string, unknown>;
  raw: {
    resourceAttributes: Record<string, unknown>;
    record: OtlpLogRecord;
  };
};

function toBigInt(value: string | number | undefined): bigint | null {
  if (value === undefined) return null;
  try {
    return typeof value === "number" ? BigInt(Math.trunc(value)) : BigInt(value);
  } catch {
    return null;
  }
}

function nanoToMs(nano: string | number | undefined): number | null {
  const bi = toBigInt(nano);
  if (bi === null) return null;
  return Number(bi / 1_000_000n);
}

function anyValueToJs(value: OtlpAnyValue | undefined): unknown {
  if (!value || typeof value !== "object") return null;
  if ("stringValue" in value) return value.stringValue;
  if ("boolValue" in value) return value.boolValue;
  if ("intValue" in value) return typeof value.intValue === "string" ? Number(value.intValue) : value.intValue;
  if ("doubleValue" in value) return value.doubleValue;
  if ("bytesValue" in value) return value.bytesValue;
  if ("arrayValue" in value) return (((value as any).arrayValue?.values as OtlpAnyValue[] | undefined) ?? []).map(anyValueToJs);
  if ("kvlistValue" in value) return keyValuesToObject(((value as any).kvlistValue?.values as OtlpKeyValue[] | undefined) ?? []);
  return value as unknown;
}

function keyValuesToObject(kvs: OtlpKeyValue[] | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const kv of kvs ?? []) {
    out[kv.key] = anyValueToJs(kv.value);
  }
  return out;
}

function pickServiceName(resourceAttrs: Record<string, unknown>): string | null {
  const direct = resourceAttrs["service.name"];
  if (typeof direct === "string" && direct.trim()) return direct;
  const alt = resourceAttrs["serviceName"];
  if (typeof alt === "string" && alt.trim()) return alt;
  return null;
}

function bodyToString(body: OtlpAnyValue | undefined): string {
  const v = anyValueToJs(body);
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function normalizeOtlpLogsResponse(input: unknown): NormalizedLogEntry[] {
  const data =
    input && typeof input === "object" && "resourceLogs" in (input as any)
      ? (input as OtlpLogsResponse)
      : ({ resourceLogs: (input as any)?.resourceLogs ?? (input as any)?.data?.resourceLogs } as OtlpLogsResponse);

  const resourceLogs = data?.resourceLogs ?? [];
  const out: NormalizedLogEntry[] = [];
  let i = 0;

  for (const rl of resourceLogs) {
    const resourceAttrs = keyValuesToObject(rl.resource?.attributes);
    const serviceName = pickServiceName(resourceAttrs);

    for (const sl of rl.scopeLogs ?? []) {
      for (const record of sl.logRecords ?? []) {
        const tsMs =
          nanoToMs(record.timeUnixNano) ??
          nanoToMs(record.observedTimeUnixNano) ??
          0;

        const attrsObj = keyValuesToObject(record.attributes);
        const severityText = record.severityText ?? null;
        const severityNumber = typeof record.severityNumber === "number" ? record.severityNumber : null;
        const body = bodyToString(record.body);

        const traceId = typeof record.traceId === "string" ? record.traceId : "";
        const spanId = typeof record.spanId === "string" ? record.spanId : "";
        const id = `${tsMs}-${serviceName ?? "unknown"}-${traceId}-${spanId}-${i++}`;

        out.push({
          id,
          tsMs,
          serviceName,
          severityText,
          severityNumber,
          body,
          attributes: attrsObj,
          raw: { resourceAttributes: resourceAttrs, record }
        });
      }
    }
  }

  out.sort((a, b) => a.tsMs - b.tsMs);
  return out;
}

