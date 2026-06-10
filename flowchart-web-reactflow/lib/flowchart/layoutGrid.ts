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
  config: LayoutConfig
): { placed: PlacedNode[]; bounds: Bounds } {
  const placed: PlacedNode[] = [];
  const lefts: number[] = [];
  const tops: number[] = [];
  const rights: number[] = [];
  const bottoms: number[] = [];

  // ADR-012: 9 列（段 + 列）対応
  // - 9 列では n.tier（段）が Y の正本になる（同じ段 = 同じ高さ）
  // - 8 列以下は従来どおり rowIndex（表行）を段の代わりに使う
  type TierBucket = {
    tier: number;
    nodes: FlowNode[];
    height: number;
  };
  const tierMap = new Map<number, TierBucket>();
  for (const ri of rowMap.keys()) {
    for (const n of rowMap.get(ri) ?? []) {
      const tier = n.tier ?? ri;
      const bucket = tierMap.get(tier) ?? {
        tier,
        nodes: [],
        height: 0,
      };
      bucket.nodes.push(n);
      bucket.height = Math.max(
        bucket.height,
        rowHeights[ri] ?? config.heightMin
      );
      tierMap.set(tier, bucket);
    }
  }

  let currentTop = config.baseTop;
  let lastTier: number | null = null;

  for (const tier of [...tierMap.keys()].sort((a, b) => a - b)) {
    const bucket = tierMap.get(tier);
    if (!bucket) continue;
    if (lastTier !== null) {
      const prev = tierMap.get(lastTier);
      currentTop += (prev?.height ?? config.heightMin) + config.gapV;
    }

    for (const n of bucket.nodes.sort(
      (a, b) => a.level - b.level || a.id.localeCompare(b.id)
    )) {
      const leftPos = config.baseLeft + n.level * (config.width + config.gapH);
      const rowH = bucket.height || config.heightMin;
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
    lastTier = tier;
  }

  const bounds: Bounds =
    lefts.length > 0
      ? {
          left: lefts.reduce((a, b) => Math.min(a, b), Infinity),
          top: tops.reduce((a, b) => Math.min(a, b), Infinity),
          right: rights.reduce((a, b) => Math.max(a, b), -Infinity),
          bottom: bottoms.reduce((a, b) => Math.max(a, b), -Infinity),
        }
      : { left: 0, top: 0, right: 0, bottom: 0 };

  return { placed, bounds };
}
