import type { EdgeTypes, NodeTypes } from "@xyflow/react";
import { LabeledEdge } from "./edges/LabeledEdge";
import { FlowShapeNode } from "./nodes/FlowShapeNode";

export const flowNodeTypes: NodeTypes = {
  flowShape: FlowShapeNode,
};

export const flowEdgeTypes: EdgeTypes = {
  labeled: LabeledEdge,
};
