import type { FlowNode, LayoutConfig } from "./types";

/** DOM 非依存。Phase 0 は固定行高。Phase 1+ で browser 実装が上書き可能 */
export type MeasureContext = {
  measureRowHeight: (nodesInRow: FlowNode[], config: LayoutConfig) => number;
};

export const fixedRowHeightContext: MeasureContext = {
  measureRowHeight: (_nodes, config) => config.heightMin,
};

export function measureRowHeights(
  rowMap: Map<number, FlowNode[]>,
  config: LayoutConfig,
  ctx: MeasureContext = fixedRowHeightContext,
): Record<number, number> {
  const heights: Record<number, number> = {};
  for (const ri of rowMap.keys()) {
    const nodes = rowMap.get(ri) ?? [];
    heights[ri] = ctx.measureRowHeight(nodes, config);
  }
  return heights;
}
