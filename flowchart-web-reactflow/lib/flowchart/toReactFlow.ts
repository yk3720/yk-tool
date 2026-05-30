import { MarkerType, type Edge, type Node } from "@xyflow/react";
import { FLOW_EDGE_LABEL, FLOW_EDGE_STROKE } from "./flowColors";
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
): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
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
    style: { stroke: FLOW_EDGE_STROKE, strokeWidth: 2.25 },
    labelStyle: {
      fill: FLOW_EDGE_LABEL,
      fontWeight: 700,
      fontSize: 11,
    },
    labelBgStyle: { fill: "#ffffff", fillOpacity: 0.9 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: FLOW_EDGE_STROKE,
      width: 16,
      height: 16,
    },
  }));

  return { nodes, edges: rfEdges };
}
