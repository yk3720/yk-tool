"use client";

import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { forwardRef, useEffect, useImperativeHandle, useMemo } from "react";
import type { FlowNodeData } from "@/lib/flowchart/toReactFlow";
import {
  fcFitViewOptions,
  fcPreviewCanvasLg,
  fcPreviewCanvasMd,
} from "./flowchartUiClasses";
import { flowEdgeTypes, flowNodeTypes } from "./flowTypes";

export type FlowCanvasHandle = {
  fitView: () => void;
  getExportElement: () => HTMLElement | null;
};

type FlowCanvasProps = {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  /** workspace プレビュー列: 縦いっぱい・左ボーダーのみ */
  fillContainer?: boolean;
};

function FlowCanvasInner(
  { nodes, edges, fillContainer = false }: FlowCanvasProps,
  ref: React.Ref<FlowCanvasHandle>
) {
  const { fitView } = useReactFlow();
  const nodeCount = nodes.length;

  useImperativeHandle(
    ref,
    () => ({
      fitView: () => {
        void fitView(fcFitViewOptions(nodeCount));
      },
      getExportElement: () =>
        document.querySelector("[data-flowchart-export-root]"),
    }),
    [fitView, nodeCount]
  );

  useEffect(() => {
    if (nodes.length > 0) {
      const t = window.setTimeout(() => {
        void fitView(fcFitViewOptions(nodes.length));
      }, 50);
      return () => window.clearTimeout(t);
    }
  }, [nodes, edges, fitView]);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: "labeled" as const,
    }),
    []
  );

  return (
    <div
      data-flowchart-export-root
      className={fillContainer ? fcPreviewCanvasLg : fcPreviewCanvasMd}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={flowNodeTypes}
        edgeTypes={flowEdgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        edgesReconnectable={false}
        panOnDrag
        zoomOnScroll
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} color="var(--flow-border)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

const FlowCanvasWithRef = forwardRef(FlowCanvasInner);

export function FlowCanvas(
  props: FlowCanvasProps & { canvasRef?: React.Ref<FlowCanvasHandle> }
) {
  const { canvasRef, ...rest } = props;
  return (
    <ReactFlowProvider>
      <FlowCanvasWithRef ref={canvasRef} {...rest} />
    </ReactFlowProvider>
  );
}
