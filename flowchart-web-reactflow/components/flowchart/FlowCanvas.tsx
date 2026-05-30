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
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react";
import type { FlowNodeData } from "@/lib/flowchart/toReactFlow";
import { flowEdgeTypes, flowNodeTypes } from "./flowTypes";

export type FlowCanvasHandle = {
  fitView: () => void;
  getExportElement: () => HTMLElement | null;
};

type FlowCanvasProps = {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
};

function FlowCanvasInner(
  { nodes, edges }: FlowCanvasProps,
  ref: React.Ref<FlowCanvasHandle>,
) {
  const { fitView } = useReactFlow();

  useImperativeHandle(
    ref,
    () => ({
      fitView: () => {
        void fitView({ padding: 0.2, duration: 200 });
      },
      getExportElement: () =>
        document.querySelector("[data-flowchart-export-root]"),
    }),
    [fitView],
  );

  useEffect(() => {
    if (nodes.length > 0) {
      const t = window.setTimeout(() => {
        void fitView({ padding: 0.2, duration: 200 });
      }, 50);
      return () => window.clearTimeout(t);
    }
  }, [nodes, edges, fitView]);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: "labeled" as const,
    }),
    [],
  );

  return (
    <div
      data-flowchart-export-root
      className="h-full min-h-[420px] w-full rounded-lg border border-slate-200 bg-slate-50"
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
        <Background gap={16} size={1} color="#e2e8f0" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

const FlowCanvasWithRef = forwardRef(FlowCanvasInner);

export function FlowCanvas(props: FlowCanvasProps & { canvasRef?: React.Ref<FlowCanvasHandle> }) {
  const { canvasRef, ...rest } = props;
  return (
    <ReactFlowProvider>
      <FlowCanvasWithRef ref={canvasRef} {...rest} />
    </ReactFlowProvider>
  );
}
