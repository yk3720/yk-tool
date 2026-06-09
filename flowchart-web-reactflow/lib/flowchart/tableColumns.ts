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

/** 10列版（段 + 列 + 色 · ADR-012 §B） */
export const TABLE_HEADERS_10 = [
  "ID",
  "図形種別",
  "接続先(下)",
  "接続先(右)",
  "段",
  "列",
  "Text1",
  "Text2",
  "Text3",
  "色",
] as const;

/** 9列版（段 + 列 · ADR-012） */
export const TABLE_HEADERS_9 = [
  "ID",
  "図形種別",
  "接続先(下)",
  "接続先(右)",
  "段",
  "列",
  "Text1",
  "Text2",
  "Text3",
] as const;

/** 作者向け · 図形種別（自動機）— SSOT: 02_spec/フローチャート記述ルール.md §2 */
export const SHAPE_TYPE_COLUMN_HELP =
  "端子=開始/終了 · 処理=自動ステップ · 判断=分岐(Yes下/No右) · 入出力=PLC/上位 · 手動入力=オペ操作";

/** 作者向け · 色列（自動機）— SSOT: 02_spec/フローチャート記述ルール.md §3 */
export const COLOR_COLUMN_HELP =
  "背景色。通常=自動運転 · 黄=重要な判断 · 橙=要注意/異常系 · 青=手動確認。形+ラベルと併用（表の赤警告とは別）";

/** 作者向け · 接続先（Yes/No · ループ）— SSOT: 02_spec/フローチャート記述ルール.md §4 */
export const CONNECT_DOWN_HELP =
  "この ID へ下矢印（判断の Yes 側になりやすい）";
export const CONNECT_RIGHT_HELP =
  "右矢印（判断の No）。上へ戻すループは右列（列=1）に1行置き、そこから接続先(下)で戻す";

/** 作者向けの列の説明（8列） */
export const COLUMN_HELP_8: Record<(typeof TABLE_HEADERS_8)[number], string> = {
  ID: "ノード番号（10, 20…）。他行の接続先にも使う",
  図形種別: SHAPE_TYPE_COLUMN_HELP,
  "接続先(下)": CONNECT_DOWN_HELP,
  "接続先(右)": CONNECT_RIGHT_HELP,
  Level: "同じ行内の横位置（0=左、1=右の分岐）",
  Text1: "図形に表示する主テキスト",
  Text2: "補足（2行目）",
  Text3: "補足（3行目）",
};

/** 作者向けの列の説明（9列） */
export const COLUMN_HELP_9: Record<(typeof TABLE_HEADERS_9)[number], string> = {
  ID: "ノード番号（10, 20…）。他行の接続先にも使う",
  図形種別: SHAPE_TYPE_COLUMN_HELP,
  "接続先(下)": CONNECT_DOWN_HELP,
  "接続先(右)": CONNECT_RIGHT_HELP,
  段: "縦位置（同じ段 = 同じ高さで横並び）",
  列: "横位置（0=左、1=右 … 分岐の並び）",
  Text1: "図形に表示する主テキスト（例: MR100 · 取付経路A）",
  Text2: "補足（2行目）",
  Text3: "補足（3行目）",
};

/** 作者向けの列の説明（10列） */
export const COLUMN_HELP_10: Record<(typeof TABLE_HEADERS_10)[number], string> =
  {
    ...COLUMN_HELP_9,
    色: COLOR_COLUMN_HELP,
  };

export const SHAPE_TYPE_OPTIONS = [
  "端子",
  "処理",
  "判断",
  "入出力",
  "手動入力",
] as const;

export type TableLayout = "legacy8" | "tier9";

/** 新規表・雛形の既定 schema（段 + 列 + 色） */
export const TIER10_SCHEMA = "table-10col-v1";

/** 9列 schema（後方互換） */
export const TIER9_SCHEMA = "table-9col-v1";

const NINE_COL_WIDTH = TABLE_HEADERS_9.length;
const TEN_COL_WIDTH = TABLE_HEADERS_10.length;

function usesTenColumnSchema(schema?: string): boolean {
  return schema?.includes("10col") ?? false;
}

function usesTierColumnSchema(schema?: string): boolean {
  return usesTenColumnSchema(schema) || schema?.includes("9col") === true;
}

function isIntegerish(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  const n = Number(value);
  return Number.isFinite(n) && Math.trunc(n) === n;
}

/** 8列幅でも中身が段+列+Text か（Text3 列欠落） */
export function inferTableLayout(
  table: FlowTableRow[],
  schema?: string
): TableLayout {
  if (usesTierColumnSchema(schema)) return "tier9";
  if (table.length === 0) return "legacy8";

  const maxLen = Math.max(...table.map((r) => r?.length ?? 0));
  if (maxLen >= NINE_COL_WIDTH) return "tier9";

  if (maxLen === 8) {
    const dataRows = table.filter((row) => {
      const id = row[0];
      if (id === null || id === undefined || id === "") return false;
      return /^\d+$/.test(String(id).split(".")[0]);
    });
    if (dataRows.length === 0) return "legacy8";

    let tier9Like = 0;
    let legacyLike = 0;
    for (const row of dataRows) {
      if (isIntegerish(row[5])) tier9Like += 1;
      else if (row[5] !== null && row[5] !== undefined && row[5] !== "") {
        legacyLike += 1;
      }
    }
    if (tier9Like > 0 && tier9Like >= legacyLike) return "tier9";
  }

  return "legacy8";
}

/**
 * 8列（Level）→ 9列（段 + 列）へ行を変換。
 * level=0 で段を進め、level>0 は直前行と同じ段・列=level。
 */
export function legacy8TableToTier9(table: FlowTableRow[]): FlowTableRow[] {
  let tier = 0;
  return table.map((row) => {
    const r = normalizeRow(row, TABLE_HEADERS_8.length);
    const level = isIntegerish(r[4]) ? Number(r[4]) : 0;
    if (level === 0) tier += 1;
    return [
      r[0],
      r[1],
      r[2],
      r[3],
      tier,
      level,
      r[5] ?? "",
      r[6] ?? "",
      r[7] ?? "",
    ];
  });
}

/** 表 UI / パーサー用の列数（tier9 は常に 10 列 · 色列込み） */
export function resolveColumnCount(
  table: FlowTableRow[],
  schema?: string
): number {
  const layout = inferTableLayout(table, schema);
  if (layout === "tier9") {
    const maxLen =
      table.length === 0
        ? TEN_COL_WIDTH
        : Math.max(...table.map((r) => r?.length ?? 0));
    return Math.max(maxLen, TEN_COL_WIDTH);
  }
  if (table.length === 0) {
    if (usesTenColumnSchema(schema)) return TEN_COL_WIDTH;
    return usesTierColumnSchema(schema)
      ? TEN_COL_WIDTH
      : TABLE_HEADERS_8.length;
  }
  return Math.max(...table.map((r) => r?.length ?? 0), TABLE_HEADERS_8.length);
}

/** 9/10列表の列幅を揃える（tier9 は 10 列 · 色列を空でパディング） */
export function ensureNineColumnTable(
  table: FlowTableRow[],
  schema?: string
): FlowTableRow[] {
  if (inferTableLayout(table, schema) !== "tier9") return table;
  const colCount = resolveColumnCount(table, schema);
  return table.map((row) => normalizeRow(row, colCount));
}

export function getColumnCount(table: FlowTableRow[], schema?: string): number {
  return resolveColumnCount(table, schema);
}

export function getHeaders(colCount: number, schema?: string): string[] {
  if (colCount >= TEN_COL_WIDTH || usesTenColumnSchema(schema)) {
    const headers: string[] = [...TABLE_HEADERS_10];
    while (headers.length < colCount) {
      headers.push(`列${headers.length + 1}`);
    }
    return headers.slice(0, colCount);
  }
  if (colCount >= NINE_COL_WIDTH || schema?.includes("9col")) {
    const headers: string[] = [...TABLE_HEADERS_9];
    while (headers.length < colCount) {
      headers.push(`列${headers.length + 1}`);
    }
    return headers.slice(0, colCount);
  }
  if (colCount >= 8) return [...TABLE_HEADERS_8].slice(0, colCount);
  if (colCount === 7) {
    return ["ID", "図形種別", "接続先(下)", "Level", "Text1", "Text2", "Text3"];
  }
  return Array.from({ length: colCount }, (_, i) => `列${i + 1}`);
}

export function getColumnHelp(
  header: string,
  colCount: number
): string | undefined {
  if (colCount >= TEN_COL_WIDTH && header in COLUMN_HELP_10) {
    return COLUMN_HELP_10[header as (typeof TABLE_HEADERS_10)[number]];
  }
  if (colCount >= 9 && header in COLUMN_HELP_9) {
    return COLUMN_HELP_9[header as (typeof TABLE_HEADERS_9)[number]];
  }
  if (colCount >= 8 && header in COLUMN_HELP_8) {
    return COLUMN_HELP_8[header as (typeof TABLE_HEADERS_8)[number]];
  }
  return undefined;
}

export function getHelpEntries(
  colCount: number,
  schema?: string
): { header: string; help: string }[] {
  return getHeaders(colCount, schema)
    .map((header) => ({ header, help: getColumnHelp(header, colCount) }))
    .filter((e): e is { header: string; help: string } => Boolean(e.help));
}

/** 表 UI で数値として編集する列 */
export function isNumericTableColumn(
  colIndex: number,
  colCount: number
): boolean {
  if (colIndex === 0) return true;
  if (colCount >= 9 && (colIndex === 4 || colIndex === 5)) return true;
  if (colCount >= 8 && colCount < 9 && colIndex === 4) return true;
  if (colCount === 7 && colIndex === 3) return true;
  return false;
}

/** 表 UI: 10列目「色」 */
export function isColorTableColumn(
  colIndex: number,
  colCount: number
): boolean {
  return colCount >= TEN_COL_WIDTH && colIndex === TEN_COL_WIDTH - 1;
}

/** 行を列数に合わせてパディング */
export function normalizeRow(
  row: FlowTableRow,
  colCount: number
): FlowTableRow {
  const out = [...row];
  while (out.length < colCount) out.push("");
  return out.slice(0, colCount);
}

export function createEmptyRow(colCount: number, id?: number): FlowTableRow {
  const row: FlowTableRow = Array(colCount).fill("");
  if (colCount >= 9) {
    row[0] = id ?? 10;
    row[1] = "処理";
    row[4] = 0;
    row[5] = 0;
  } else if (colCount >= 8) {
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
