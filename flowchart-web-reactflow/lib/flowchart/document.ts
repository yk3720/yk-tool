import type { FlowchartDocument, FlowTableRow } from "./types";
import { DEFAULT_LAYOUT } from "./types";
import { flowchartDocumentPayloadSchema } from "./importBundleSchema";
import {
  ensureNineColumnTable,
  inferTableLayout,
  TIER10_SCHEMA,
  TIER9_SCHEMA,
} from "./tableColumns";

export function createDocument(
  table: FlowTableRow[],
  partial?: Partial<
    Omit<FlowchartDocument, "version" | "table" | "layout" | "createdAt">
  >
): FlowchartDocument {
  const schema = partial?.schema ?? TIER10_SCHEMA;
  return {
    version: 1,
    schema,
    title: partial?.title ?? "無題のフロー",
    table: ensureNineColumnTable(table, schema),
    layout: { ...DEFAULT_LAYOUT },
    createdAt: new Date().toISOString(),
  };
}

export function parseFlowchartDocument(jsonText: string): {
  doc: FlowchartDocument | null;
  errors: string[];
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { doc: null, errors: ["JSON の形式が不正です"] };
  }

  const result = flowchartDocumentPayloadSchema.safeParse(parsed);
  if (!result.success) {
    return {
      doc: null,
      errors: result.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
        return `${path}${issue.message}`;
      }),
    };
  }

  const data = result.data;
  const doc: FlowchartDocument = {
    version: 1,
    schema: data.schema,
    title: data.title,
    table: data.table as FlowTableRow[],
    layout: { ...DEFAULT_LAYOUT },
    createdAt: data.createdAt ?? new Date().toISOString(),
  };

  return { doc: normalizeFlowchartDocument(doc), errors: [] };
}

/** 読込時: tier9 を 10 列に揃え · schema を table-10col-v1 へ */
export function normalizeFlowchartDocument(
  doc: FlowchartDocument
): FlowchartDocument {
  const layout = inferTableLayout(doc.table, doc.schema);
  const schemaForPad = layout === "tier9" ? TIER10_SCHEMA : doc.schema;
  const table = ensureNineColumnTable(doc.table, schemaForPad);
  const schema = layout === "tier9" ? TIER10_SCHEMA : doc.schema;
  return { ...doc, table, ...(schema ? { schema } : {}) };
}

export function serializeDocument(doc: FlowchartDocument): string {
  const normalized = normalizeFlowchartDocument(doc);
  const payload = {
    version: normalized.version,
    ...(normalized.schema ? { schema: normalized.schema } : {}),
    title: normalized.title,
    table: normalized.table,
    layout: { ...DEFAULT_LAYOUT },
    createdAt: normalized.createdAt,
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadJson(doc: FlowchartDocument, filename?: string) {
  const name =
    filename ??
    `flowchart-${(doc.title ?? "export").replace(/[^\w\u3040-\u30ff\u4e00-\u9fff-]+/g, "_")}.json`;
  const blob = new Blob([serializeDocument(doc)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
