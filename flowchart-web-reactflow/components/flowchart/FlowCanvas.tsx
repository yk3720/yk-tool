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
  type KeyboardEvent,
} from "react";
import type { FlowNodeData } from "@/lib/flowchart/toReactFlow";
import { flowPreviewAriaLabel } from "@/lib/flowchart/flowPreviewA11y";
import { cn } from "@/lib/utils";
import {
  fcCanvasA11y,
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

const PAN_STEP = 50;

function FlowCanvasInner(
  { nodes, edges, fillContainer = false }: FlowCanvasProps,
  ref: React.Ref<FlowCanvasHandle>
) {
  const { fitView, getViewport, setViewport, zoomIn, zoomOut } = useReactFlow();
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const previewLabel = flowPreviewAriaLabel(nodeCount, edgeCount);

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

  const handlePanZoomKey = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest(".react-flow__controls button")) return;

      switch (e.key) {
        case "ArrowLeft": {
          e.preventDefault();
          const v = getViewport();
          setViewport({ x: v.x + PAN_STEP, y: v.y, zoom: v.zoom });
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          const v = getViewport();
          setViewport({ x: v.x - PAN_STEP, y: v.y, zoom: v.zoom });
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const v = getViewport();
          setViewport({ x: v.x, y: v.y + PAN_STEP, zoom: v.zoom });
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          const v = getViewport();
          setViewport({ x: v.x, y: v.y - PAN_STEP, zoom: v.zoom });
          break;
        }
        case "+":
        case "=":
          e.preventDefault();
          zoomIn();
          break;
        case "-":
        case "_":
          e.preventDefault();
          zoomOut();
          break;
        case "0":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            void fitView(fcFitViewOptions(nodeCount));
          }
          break;
        default:
          break;
      }
    },
    [fitView, getViewport, nodeCount, setViewport, zoomIn, zoomOut]
  );

  return (
    <div
      data-flowchart-export-root
      data-testid="flow-preview-canvas"
      className={fillContainer ? fcPreviewCanvasLg : fcPreviewCanvasMd}
    >
      <div
        role="group"
        aria-label={previewLabel}
        tabIndex={0}
        onKeyDown={handlePanZoomKey}
        className={cn(fcCanvasA11y, "h-full w-full")}
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
