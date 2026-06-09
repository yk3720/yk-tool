import type { FlowTableRow } from "./types";

/** 1行をタブまたはカンマで分割（引用符は未対応・Excel貼り付け想定） */
function splitLine(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];
  const tabCount = (trimmed.match(/\t/g) ?? []).length;
  const commaCount = (trimmed.match(/,/g) ?? []).length;
  const sep = tabCount >= commaCount ? "\t" : ",";
  return trimmed.split(sep).map((c) => c.trim());
}

function cellValue(
  raw: string,
  colIndex: number,
  colCount: number
): string | number {
  if (colIndex === 0) {
    if (raw === "") return "";
    const n = Number(raw);
    return Number.isFinite(n) ? n : raw;
  }
  const isNumericLayoutCol =
    (colCount >= 9 && (colIndex === 4 || colIndex === 5)) ||
    (colCount >= 8 && colCount < 9 && colIndex === 4);
  if (isNumericLayoutCol) {
    if (raw === "") return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  }
  return raw;
}

/**
 * 2次元セル文字列 → 表行配列（CSV 貼り付け · Excel 取込の共通入口）
 */
export function parseTableRows(rows: string[][]): {
  table: FlowTableRow[];
  errors: string[];
} {
  const errors: string[] = [];
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (nonEmpty.length === 0) {
    return { table: [], errors: ["有効な行がありません"] };
  }

  const colCount = Math.max(...nonEmpty.map((r) => r.length));
  if (colCount < 6) {
    errors.push(
      `列数が ${colCount} です。6 列以上（判断を含む場合は 8 列）が必要です`
    );
  }

  const first = nonEmpty[0][0]?.toLowerCase() ?? "";
  const skipHeader =
    first === "id" || first === "ｉｄ" || first.includes("図形");

  const dataRows = skipHeader ? nonEmpty.slice(1) : nonEmpty;
  if (dataRows.length === 0) {
    return { table: [], errors: ["データ行がありません（1行目がヘッダのみ）"] };
  }

  const table: FlowTableRow[] = dataRows.map((cells) => {
    const row: FlowTableRow = [];
    for (let c = 0; c < colCount; c++) {
      row.push(cellValue(cells[c] ?? "", c, colCount));
    }
    return row;
  });

  return { table, errors };
}

/**
 * スプレッドシート／CSV 貼り付け文字列 → 表行配列
 */
export function parseCsvPaste(text: string): {
  table: FlowTableRow[];
  errors: string[];
} {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) {
    return { table: [], errors: ["貼り付け内容が空です"] };
  }

  const rows = lines.map(splitLine).filter((r) => r.length > 0);
  if (rows.length === 0) {
    return { table: [], errors: ["有効な行がありません"] };
  }

  return parseTableRows(rows);
}
