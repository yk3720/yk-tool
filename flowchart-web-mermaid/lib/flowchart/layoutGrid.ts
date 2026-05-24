import { isDecisionType } from "./normalizeShapeType";
import type {
  Bounds,
  FlowNode,
  LayoutConfig,
  PlacedNode,
  ShapeKind,
} from "./types";

function shapeKindFor(type: FlowNode["type"]): ShapeKind {
  if (type === "判断") return "diamond";
  if (type === "端子") return "rounded";
  if (type === "入出力") return "parallelogram";
  if (type === "手動入力") return "manual";
  return "rectangle";
}

export function layoutGrid(
  rowMap: Map<number, FlowNode[]>,
  rowHeights: Record<number, number>,
  config: LayoutConfig,
): { placed: PlacedNode[]; bounds: Bounds } {
  const placed: PlacedNode[] = [];
  const lefts: number[] = [];
  const tops: number[] = [];
  const rights: number[] = [];
  const bottoms: number[] = [];

  let currentTop = config.baseTop;
  let lastRi = -1;

  for (const ri of [...rowMap.keys()].sort((a, b) => a - b)) {
    if (lastRi !== -1) {
      currentTop += (rowHeights[lastRi] ?? config.heightMin) + config.gapV;
    }

    for (const n of rowMap.get(ri) ?? []) {
      const leftPos = config.baseLeft + n.level * (config.width + config.gapH);
      const rowH = rowHeights[ri] ?? config.heightMin;
      const isDiamond = isDecisionType(n.type);
      const shpH = isDiamond ? rowH * 1.3 : rowH;
      const vOff = isDiamond ? (shpH - rowH) / 2 : 0;
      const top = currentTop - vOff;

      const node: PlacedNode = {
        ...n,
        x: leftPos,
        y: top,
        width: config.width,
        height: shpH,
        shapeKind: shapeKindFor(n.type),
      };
      placed.push(node);
      lefts.push(leftPos);
      tops.push(top);
      rights.push(leftPos + config.width);
      bottoms.push(top + shpH);
    }
    lastRi = ri;
  }

  const bounds: Bounds =
    lefts.length > 0
      ? {
          left: Math.min(...lefts),
          top: Math.min(...tops),
          right: Math.max(...rights),
          bottom: Math.max(...bottoms),
        }
      : { left: 0, top: 0, right: 0, bottom: 0 };

  return { placed, bounds };
}
