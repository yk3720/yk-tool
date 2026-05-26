import { isDecisionType } from "./normalizeShapeType";
import type { ConnectorSite, FlowEdge, FlowNode, PlacedNode } from "./types";

function labelForDecision(
  source: FlowNode,
  direction: "down" | "right",
): "Yes" | "No" | undefined {
  if (!isDecisionType(source.type)) return undefined;
  return direction === "down" ? "Yes" : "No";
}

export function buildEdges(
  nodes: FlowNode[],
  placed: PlacedNode[],
): FlowEdge[] {
  const placedById = new Map(placed.map((p) => [p.id, p]));
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const edges: FlowEdge[] = [];
  let edgeIndex = 0;

  // Merge/bus heuristic (ADR-012 / M002):
  // When multiple "down" edges converge to one target, prefer side-entry from left/right
  // so SmoothStep produces a readable horizontal-ish "bus" before entering the target.
  const inboundDownCount = new Map<string, number>();
  for (const n of nodes) {
    for (const did of n.destsDown) {
      inboundDownCount.set(did, (inboundDownCount.get(did) ?? 0) + 1);
    }
  }

  for (const n of nodes) {
    const source = placedById.get(n.id);
    if (!source) continue;

    for (const [direction, dests] of [
      ["down", n.destsDown] as const,
      ["right", n.destsRight] as const,
    ]) {
      for (const did of dests) {
        const target = placedById.get(did);
        const tNode = nodeById.get(did);
        if (!target || !tNode) continue;

        const isLoop = tNode.rowIndex < n.rowIndex;
        const levelDiff = tNode.level - n.level;
        const isMerge = direction === "down" && (inboundDownCount.get(did) ?? 0) > 1;

        let sourceSide: ConnectorSite = "bottom";
        let targetSide: ConnectorSite = "top";
        let route: "straight" | "elbow" = "straight";

        if (direction === "down") {
          if (isMerge && !isLoop) {
            route = "elbow";
            targetSide = "top";
            if (levelDiff > 0) sourceSide = "right";
            else if (levelDiff < 0) sourceSide = "left";
          }
          if (levelDiff !== 0 || isLoop) {
            route = "elbow";
            if (levelDiff < 0) targetSide = "left";
            else if (levelDiff > 0) {
              sourceSide = "right";
              targetSide = "top";
            }
          }
          if (
            Math.abs(source.x - target.x) < 5 &&
            !isLoop &&
            route === "straight"
          ) {
            route = "straight";
          }
        } else {
          sourceSide = "right";
          targetSide = "top";
          route = "elbow";
          if (levelDiff === 0 && isLoop) targetSide = "right";
          else if (levelDiff < 0) targetSide = "left";
        }

        if (
          direction === "down" &&
          Math.abs(source.x - target.x) < 5 &&
          !isLoop &&
          !isMerge
        ) {
          route = "straight";
        }

        edges.push({
          id: `e-${edgeIndex++}`,
          sourceId: n.id,
          targetId: did,
          direction,
          sourceSide,
          targetSide,
          route,
          label: labelForDecision(n, direction),
        });
      }
    }
  }

  return edges;
}
