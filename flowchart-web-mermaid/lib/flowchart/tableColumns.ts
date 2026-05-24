import type { FlowTableRow } from "./types";

/** 8列版のヘッダ（データモデル SSOT） */
export const TABLE_HEADERS_8 = [
  "ID",
  "図形種別",
  "接続先(下)",
  "接続先(右)",
  "Level",
  "Text1",
  "Text2",
  "Text3",
] as const;

/** 作者向けの列の説明（8列） */
export const COLUMN_HELP_8: Record<(typeof TABLE_HEADERS_8)[number], string> = {
  ID: "ノード番号（10, 20…）。他行の接続先にも使う",
  図形種別: "端子・処理・判断・入出力・手動入力",
  "接続先(下)": "この ID へ下矢印（判断の Yes 側になりやすい）",
  "接続先(右)": "この ID へ右矢印（判断の No 側になりやすい）",
  Level: "同じ行内の横位置（0=左、1=右の分岐）",
  Text1: "図形に表示する主テキスト",
  Text2: "補足（2行目）",
  Text3: "補足（3行目）",
};

export const SHAPE_TYPE_OPTIONS = [
  "端子",
  "処理",
  "判断",
  "入出力",
  "手動入力",
] as const;

export function getColumnCount(table: FlowTableRow[]): number {
  if (table.length === 0) return TABLE_HEADERS_8.length;
  return Math.max(...table.map((r) => r?.length ?? 0), TABLE_HEADERS_8.length);
}

export function getHeaders(colCount: number): string[] {
  if (colCount >= 8) return [...TABLE_HEADERS_8];
  if (colCount === 7) {
    return ["ID", "図形種別", "接続先(下)", "Level", "Text1", "Text2", "Text3"];
  }
  return Array.from({ length: colCount }, (_, i) => `列${i + 1}`);
}

/** 行を列数に合わせてパディング */
export function normalizeRow(
  row: FlowTableRow,
  colCount: number,
): FlowTableRow {
  const out = [...row];
  while (out.length < colCount) out.push("");
  return out.slice(0, colCount);
}

export function createEmptyRow(colCount: number, id?: number): FlowTableRow {
  const row: FlowTableRow = Array(colCount).fill("");
  if (colCount >= 8) {
    row[0] = id ?? 10;
    row[1] = "処理";
    row[4] = 0;
  } else if (colCount >= 2) {
    row[0] = id ?? 10;
    row[1] = "処理";
  }
  return row;
}

/** 数値 ID の最大値 + 10（新規行用） */
export function suggestNextId(table: FlowTableRow[]): number {
  let max = 0;
  for (const row of table) {
    const raw = row[0];
    if (raw === null || raw === undefined || raw === "") continue;
    const n = Number(String(raw).split(".")[0]);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return max > 0 ? max + 10 : 10;
}
