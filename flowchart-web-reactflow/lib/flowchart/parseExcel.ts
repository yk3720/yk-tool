import * as XLSX from "xlsx";
import { parseTableRows } from "./parseCsv";

/** zip bomb 対策 — 展開前のファイルサイズ上限 */
export const MAX_EXCEL_BYTES = 5 * 1024 * 1024;

const PREFERRED_SHEET_NAMES = [
  "表",
  "データ",
  "data",
  "table",
  "フロー",
  "flow",
  "フローチャート",
  "flowchart",
];

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function sheetToStringRows(sheet: XLSX.WorkSheet): string[][] {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  return matrix.map((row) => {
    const cells = Array.isArray(row) ? row : [row];
    return cells.map(stringifyCell);
  });
}

function scoreDataSheet(rows: string[][]): number {
  let score = 0;
  for (const row of rows) {
    const filled = row.filter((c) => c !== "").length;
    if (filled >= 4 && row.length >= 6) score += filled;
  }
  return score;
}

/** 8列表が入っていそうなシートを選ぶ（図形シートより表シートを優先） */
export function pickFlowchartSheetName(workbook: XLSX.WorkBook): string | null {
  const names = workbook.SheetNames;
  if (names.length === 0) return null;

  for (const preferred of PREFERRED_SHEET_NAMES) {
    const hit = names.find(
      (n) =>
        n.toLowerCase() === preferred.toLowerCase() || n.includes(preferred)
    );
    if (hit) return hit;
  }

  let bestName = names[0];
  let bestScore = -1;
  for (const name of names) {
    const rows = sheetToStringRows(workbook.Sheets[name]);
    const score = scoreDataSheet(rows);
    if (score > bestScore) {
      bestScore = score;
      bestName = name;
    }
  }
  return bestScore > 0 ? bestName : names[0];
}

export type ParseExcelResult = {
  table: import("./types").FlowTableRow[];
  errors: string[];
  sheetName: string;
};

/**
 * .xlsx / .xls の ArrayBuffer → 表行配列
 */
export function parseExcelBuffer(buffer: ArrayBuffer): ParseExcelResult {
  if (buffer.byteLength > MAX_EXCEL_BYTES) {
    const mb = (MAX_EXCEL_BYTES / (1024 * 1024)).toFixed(0);
    return {
      table: [],
      errors: [`Excel ファイルが大きすぎます（上限 ${mb} MB）`],
      sheetName: "",
    };
  }

  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = pickFlowchartSheetName(workbook);
  if (!sheetName) {
    return { table: [], errors: ["シートがありません"], sheetName: "" };
  }

  const rows = sheetToStringRows(workbook.Sheets[sheetName]);
  const { table, errors } = parseTableRows(rows);
  return { table, errors, sheetName };
}
