"use client";

import {
  Handle,
  Position,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { memo } from "react";
import type { FlowNodeData } from "@/lib/flowchart/toReactFlow";

const HANDLE_STYLE = { width: 6, height: 6, opacity: 0 };

function ShapeBody({ data }: { data: FlowNodeData }) {
  const label = data.label.split("\n").map((line, i) => (
    <span key={i} className="block leading-snug">
      {line}
    </span>
  ));

  const base =
    "flow-shape-body flex h-full w-full items-center justify-center border border-slate-500 bg-white px-2 py-1 text-center text-[11px] font-medium text-slate-800";

  switch (data.shapeKind) {
    case "diamond":
      return (
        <div
          className={`${base} flow-node-diamond`}
          title={data.shapeType}
        >
          {label}
        </div>
      );
    case "rounded":
      return (
        <div
          className={`${base} rounded-2xl border-2`}
          title={data.shapeType}
        >
          {label}
        </div>
      );
    case "parallelogram":
      return (
        <div
          className={`${base} flow-node-parallelogram`}
          title={data.shapeType}
        >
          {label}
        </div>
      );
    case "manual":
      return (
        <div
          className={`${base} flow-node-manual`}
          title={data.shapeType}
        >
          {label}
        </div>
      );
    default:
      return (
        <div
          className={`${base} rounded-sm`}
          title={data.shapeType}
        >
          {label}
        </div>
      );
  }
}

function FlowShapeNodeComponent({ data }: NodeProps<Node<FlowNodeData>>) {
  return (
    <>
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        style={HANDLE_STYLE}
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        style={HANDLE_STYLE}
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        style={HANDLE_STYLE}
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        style={HANDLE_STYLE}
      />
      <ShapeBody data={data} />
    </>
  );
}

export const FlowShapeNode = memo(FlowShapeNodeComponent);
