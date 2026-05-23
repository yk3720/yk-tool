import type { FlowchartDocument, FlowTableRow, LayoutConfig } from "./types";
import { DEFAULT_LAYOUT } from "./types";

export function createDocument(
  table: FlowTableRow[],
  partial?: Partial<Omit<FlowchartDocument, "version" | "table" | "createdAt">>,
): FlowchartDocument {
  return {
    version: 1,
    title: partial?.title ?? "無題のフロー",
    table,
    layout: { ...DEFAULT_LAYOUT, ...partial?.layout },
    themeId: partial?.themeId,
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

  const layout = {
    ...DEFAULT_LAYOUT,
    ...(typeof obj.layout === "object" && obj.layout !== null
      ? (obj.layout as LayoutConfig)
      : {}),
  };

  const doc: FlowchartDocument = {
    version: 1,
    title: typeof obj.title === "string" ? obj.title : undefined,
    table: obj.table as FlowTableRow[],
    layout,
    themeId: typeof obj.themeId === "string" ? obj.themeId : undefined,
    createdAt:
      typeof obj.createdAt === "string"
        ? obj.createdAt
        : new Date().toISOString(),
  };

  return { doc, errors: [] };
}

export function serializeDocument(doc: FlowchartDocument): string {
  return JSON.stringify(doc, null, 2);
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
