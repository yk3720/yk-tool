import { buildEdges } from "./buildEdges";
import { layoutGrid } from "./layoutGrid";
import { measureRowHeights } from "./measureHeights";
import { parseTable } from "./parseTable";
import { validateTable } from "./validate";
import type { FlowTableRow, GenerateResult, LayoutConfig } from "./types";
import { DEFAULT_LAYOUT } from "./types";

export function generateFlowchart(
  table: FlowTableRow[],
  layout: LayoutConfig = DEFAULT_LAYOUT
): GenerateResult {
  const errors = validateTable(table);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const { nodes, rowMap } = parseTable(table);
  const rowHeights = measureRowHeights(rowMap, layout);
  const { placed, bounds } = layoutGrid(rowMap, rowHeights, layout);
  const edges = buildEdges(nodes, placed);

  return { ok: true, nodes, placed, edges, bounds };
}
