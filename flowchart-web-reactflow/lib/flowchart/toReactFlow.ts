import { MarkerType, type Edge, type Node } from "@xyflow/react";
import { branchFromEdgeLabel } from "./edgeLabelPlacement";
import { FLOW_EDGE_STROKE, type ColorHint } from "./flowColors";
import type { FlowEdge, PlacedNode, ShapeKind } from "./types";

export type FlowEdgeData = {
  route: FlowEdge["route"];
  direction: FlowEdge["direction"];
  branch?: ReturnType<typeof branchFromEdgeLabel>;
  /** 表示文言（edge.label は使わず二重描画を防ぐ） */
  edgeLabel?: FlowEdge["label"];
};

export type FlowNodeData = {
  label: string;
  shapeKind: ShapeKind;
  shapeType: string;
  colorHint?: ColorHint;
};

const NODE_TYPE = "flowShape";

export function shapeKindToNodeType(_kind: ShapeKind): string {
  return NODE_TYPE;
}

export function toReactFlow(
  placed: PlacedNode[],
  edges: FlowEdge[]
): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const nodes: Node<FlowNodeData>[] = placed.map((p) => ({
    id: p.id,
    type: NODE_TYPE,
    position: { x: p.x, y: p.y },
    data: {
      label: p.fullText || p.type,
      shapeKind: p.shapeKind,
      shapeType: p.type,
      ...(p.colorHint !== undefined ? { colorHint: p.colorHint } : {}),
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
    data: {
      route: e.route,
      direction: e.direction,
      branch: branchFromEdgeLabel(e.label),
      edgeLabel: e.label,
    } satisfies FlowEdgeData,
    style: { stroke: FLOW_EDGE_STROKE, strokeWidth: 2.25 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: FLOW_EDGE_STROKE,
      width: 16,
      height: 16,
    },
  }));

  return { nodes, edges: rfEdges };
}
