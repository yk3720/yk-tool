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

        let sourceSide: ConnectorSite = "bottom";
        let targetSide: ConnectorSite = "top";
        let route: "straight" | "elbow" = "straight";

        if (direction === "down") {
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
          !isLoop
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
