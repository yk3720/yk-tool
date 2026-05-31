/** フローチャート描画の固定色（テーマ切替なし · 計画 B で表「色」列から上書き予定）
 *  枠太さ SSOT: VISUAL_DESIGN_RULES §2 · RULE_INDEX No 19 */
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
