import { MarkerType, type Edge, type Node } from "@xyflow/react";
import { FLOW_THEMES, resolveThemeId, type ThemeId } from "./themes";
import type { FlowEdge, PlacedNode, ShapeKind } from "./types";

export type FlowNodeData = {
  label: string;
  shapeKind: ShapeKind;
  shapeType: string;
};

const NODE_TYPE = "flowShape";

export function shapeKindToNodeType(_kind: ShapeKind): string {
  return NODE_TYPE;
}

export function toReactFlow(
  placed: PlacedNode[],
  edges: FlowEdge[],
  themeId?: ThemeId | string,
): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const theme = FLOW_THEMES[resolveThemeId(themeId)];
  const nodes: Node<FlowNodeData>[] = placed.map((p) => ({
    id: p.id,
    type: NODE_TYPE,
    position: { x: p.x, y: p.y },
    data: {
      label: p.fullText || p.type,
      shapeKind: p.shapeKind,
      shapeType: p.type,
    },
    width: p.width,
    height: p.height,
    draggable: false,
    selectable: false,
    connectable: false,
  }));

  const rfEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.sourceId,
    target: e.targetId,
    sourceHandle: e.sourceSide,
    targetHandle: e.targetSide,
    type: "labeled",
    data: { route: e.route },
    label: e.label,
    style: { stroke: theme.edgeStroke, strokeWidth: 2.25 },
    labelStyle: {
      fill: theme.edgeLabel,
      fontWeight: 700,
      fontSize: 11,
    },
    labelBgStyle: { fill: "#ffffff", fillOpacity: 0.9 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: theme.edgeStroke,
      width: 16,
      height: 16,
    },
  }));

  return { nodes, edges: rfEdges };
}
