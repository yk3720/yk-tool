/** フローチャート描画の固定色（テーマ切替なし）
 *  枠太さ SSOT: VISUAL_DESIGN_RULES §2 · RULE_INDEX No 19
 *  ノード背景: 表「色」列（10列目）→ colorHint → FLOW_NODE_FILL_BY_HINT */
export const FLOW_EDGE_STROKE = "#2563eb";
export const FLOW_EDGE_LABEL = "#0f172a";
/** ノード枠の既定色（判断 SVG stroke · 矩形 border 相当） */
export const FLOW_NODE_FRAME_STROKE = "#1a1a1a";
/** ノード枠の太さ（px）— 矩形・端子など CSS border */
export const FLOW_NODE_FRAME_WIDTH = 2;
/** 菱形 SVG stroke — 矩形と同じ 2px（miter join） */
export const FLOW_NODE_DIAMOND_STROKE_WIDTH = FLOW_NODE_FRAME_WIDTH;
/** Yes/No ラベルをコネクタ線の右側へ離す距離（px） */
export const FLOW_EDGE_LABEL_GAP = 14;

/** 表「色」列 → 内部 hint（parse / 描画 SSOT） */
export type ColorHint = "normal" | "yellow" | "orange" | "blue";

/** 表 UI セレクト用（セル値 = 日本語キーワード） */
export const COLOR_HINT_SELECT_OPTIONS = [
  { value: "", label: "（通常）" },
  { value: "黄", label: "黄" },
  { value: "橙", label: "橙" },
  { value: "青", label: "青" },
] as const;

const COLOR_CELL_TO_HINT: Record<string, ColorHint> = {
  黄: "yellow",
  橙: "orange",
  青: "blue",
};

/** 凡例表示用 — SSOT: 02_spec/フローチャート記述ルール.md §3 */
export const COLOR_HINT_LEGEND_ITEMS: {
  hint: ColorHint;
  label: string;
  title: string;
  fill: string;
}[] = [
  {
    hint: "normal",
    label: "通常・自動運転",
    title: "通常の自動ステップ（大部分は空のまま）",
    fill: "#ffffff",
  },
  {
    hint: "yellow",
    label: "黄・重要な判断",
    title: "重要な分岐・インターロック条件（判断菱形と併用）",
    fill: "#fef9c3",
  },
  {
    hint: "orange",
    label: "橙・要注意",
    title: "異常復帰・要注意工程（表の赤エラー行とは別）",
    fill: "#ffedd5",
  },
  {
    hint: "blue",
    label: "青・手動確認",
    title: "オペ確認・手動介入・セットアップ（手動入力と併用推奨）",
    fill: "#dbeafe",
  },
];

export const FLOW_NODE_FILL_BY_HINT: Record<ColorHint, string> = {
  normal: "#ffffff",
  yellow: "#fef9c3",
  orange: "#ffedd5",
  blue: "#dbeafe",
};

export function normalizeColorHint(cell: unknown): {
  hint: ColorHint;
  unknown: boolean;
} {
  if (cell === null || cell === undefined) {
    return { hint: "normal", unknown: false };
  }
  const trimmed = String(cell).trim();
  if (trimmed === "") {
    return { hint: "normal", unknown: false };
  }
  const hint = COLOR_CELL_TO_HINT[trimmed];
  if (hint) {
    return { hint, unknown: false };
  }
  return { hint: "normal", unknown: true };
}

export function nodeBackgroundColor(hint?: ColorHint): string {
  return FLOW_NODE_FILL_BY_HINT[hint ?? "normal"];
}
