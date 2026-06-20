import {
  createEmptyRow,
  isNumericTableColumn,
  normalizeRow,
  suggestNextId,
} from "./tableColumns";
import type { FlowTableRow } from "./types";

/** 1行をタブまたはカンマで分割（Excel 貼り付け想定 · parseCsv と同等） */
function splitLine(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];
  const tabCount = (trimmed.match(/\t/g) ?? []).length;
  const commaCount = (trimmed.match(/,/g) ?? []).length;
  const sep = tabCount >= commaCount ? "\t" : ",";
  return trimmed.split(sep).map((c) => c.trim());
}

/** クリップボード文字列 → 2次元セル（ヘッダー判定なし · 部分貼り付け用） */
export function parseClipboardGrid(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];
  return lines.map(splitLine).filter((r) => r.length > 0);
}

export function parsePasteCellValue(
  colIndex: number,
  colCount: number,
  raw: string
): string | number {
  if (!isNumericTableColumn(colIndex, colCount)) return raw;
  if (colIndex === 0) {
    const trimmed = raw.trim();
    if (trimmed === "") return "";
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : trimmed;
  }
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

/**
 * 表の (startRow, startCol) 起点にクリップボード範囲を上書き。
 * 行が足りなければ末尾に追加する。
 */
export function applyPartialPaste(
  table: FlowTableRow[],
  startRow: number,
  startCol: number,
  pasted: string[][],
  colCount: number
): FlowTableRow[] {
  if (pasted.length === 0) return table;

  const result = table.map((row) => normalizeRow(row, colCount));
  const endRow = startRow + pasted.length;

  while (result.length < endRow) {
    result.push(createEmptyRow(colCount, suggestNextId(result)));
  }

  for (let pr = 0; pr < pasted.length; pr++) {
    const rowIndex = startRow + pr;
    const pasteRow = pasted[pr] ?? [];
    for (let pc = 0; pc < pasteRow.length; pc++) {
      const colIndex = startCol + pc;
      if (colIndex >= colCount) break;
      result[rowIndex][colIndex] = parsePasteCellValue(
        colIndex,
        colCount,
        pasteRow[pc] ?? ""
      );
    }
  }

  return result.map((row) => normalizeRow(row, colCount));
}
