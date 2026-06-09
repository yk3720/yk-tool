import type { FlowNode, LayoutConfig } from "./types";

/** 11px · leading-snug 相当の行高（px） */
const TEXT_LINE_HEIGHT = 14;
const TEXT_VERTICAL_PAD = 8;

export function textLineCount(node: FlowNode): number {
  const lines = node.fullText.split("\n").filter((line) => line.length > 0);
  return Math.max(1, lines.length);
}

export function measureTextAwareRowHeight(
  nodesInRow: FlowNode[],
  config: LayoutConfig
): number {
  let maxLines = 1;
  for (const n of nodesInRow) {
    maxLines = Math.max(maxLines, textLineCount(n));
  }
  return Math.max(
    config.heightMin,
    maxLines * TEXT_LINE_HEIGHT + TEXT_VERTICAL_PAD
  );
}

/** DOM 非依存。browser 実装は MeasureContext で差し替え可能 */
export type MeasureContext = {
  measureRowHeight: (nodesInRow: FlowNode[], config: LayoutConfig) => number;
};

export const fixedRowHeightContext: MeasureContext = {
  measureRowHeight: measureTextAwareRowHeight,
};

export function measureRowHeights(
  rowMap: Map<number, FlowNode[]>,
  config: LayoutConfig,
  ctx: MeasureContext = fixedRowHeightContext
): Record<number, number> {
  const heights: Record<number, number> = {};
  for (const ri of rowMap.keys()) {
    const nodes = rowMap.get(ri) ?? [];
    heights[ri] = ctx.measureRowHeight(nodes, config);
  }
  return heights;
}
