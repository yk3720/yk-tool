import type { FlowchartDocument, FlowTableRow } from "./types";
import { DEFAULT_LAYOUT } from "./types";
import {
  ensureNineColumnTable,
  inferTableLayout,
} from "./tableColumns";

export function createDocument(
  table: FlowTableRow[],
  partial?: Partial<Omit<FlowchartDocument, "version" | "table" | "layout" | "createdAt">>,
): FlowchartDocument {
  return {
    version: 1,
    title: partial?.title ?? "無題のフロー",
    table,
    layout: { ...DEFAULT_LAYOUT },
    createdAt: new Date().toISOString(),
  };
}

export function parseFlowchartDocument(
  jsonText: string,
): { doc: FlowchartDocument | null; errors: string[] } {
  const errors: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { doc: null, errors: ["JSON の形式が不正です"] };
  }

  if (!parsed || typeof parsed !== "object") {
    return { doc: null, errors: ["ルートはオブジェクトである必要があります"] };
  }

  const obj = parsed as Record<string, unknown>;
  if (obj.version !== 1) {
    errors.push("version は 1 である必要があります");
  }
  if (!Array.isArray(obj.table)) {
    errors.push("table 配列が必要です");
  }
  if (errors.length > 0) {
    return { doc: null, errors };
  }

  const doc: FlowchartDocument = {
    version: 1,
    schema: typeof obj.schema === "string" ? obj.schema : undefined,
    title: typeof obj.title === "string" ? obj.title : undefined,
    table: obj.table as FlowTableRow[],
    layout: { ...DEFAULT_LAYOUT },
    createdAt:
      typeof obj.createdAt === "string"
        ? obj.createdAt
        : new Date().toISOString(),
  };

  return { doc: normalizeFlowchartDocument(doc), errors: [] };
}

/** 9列表の列幅·schema を揃える（読込時） */
export function normalizeFlowchartDocument(
  doc: FlowchartDocument,
): FlowchartDocument {
  const table = ensureNineColumnTable(doc.table, doc.schema);
  const layout = inferTableLayout(table, doc.schema);
  const schema =
    layout === "tier9"
      ? doc.schema?.includes("9col")
        ? doc.schema
        : "table-9col-v1"
      : doc.schema;
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
