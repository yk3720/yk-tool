import type { ShapeType } from "./types";

/** MZ0000 shape_placer と同様の部分一致正規化 */
export function normalizeShapeType(raw: string): ShapeType {
  const s = raw.trim();
  if (!s) return "処理";
  if (s.includes("判断")) return "判断";
  if (["端子", "開始", "終了"].some((k) => s.includes(k))) return "端子";
  if (["入出力", "データ"].some((k) => s.includes(k))) return "入出力";
  if (s.includes("手動入力")) return "手動入力";
  return "処理";
}

export function isDecisionType(type: ShapeType | string): boolean {
  return String(type).includes("判断");
}
