"use client";

import {
  Handle,
  Position,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { memo } from "react";
import {
  FLOW_NODE_DIAMOND_STROKE_WIDTH,
  FLOW_NODE_FRAME_STROKE,
  FLOW_NODE_FRAME_WIDTH,
  nodeBackgroundColor,
  type ColorHint,
} from "@/lib/flowchart/flowColors";
import type { FlowNodeData } from "@/lib/flowchart/toReactFlow";

const HANDLE_STYLE = { width: 6, height: 6, opacity: 0 };

function frameStyle(hint?: ColorHint) {
  return {
    borderColor: FLOW_NODE_FRAME_STROKE,
    borderWidth: FLOW_NODE_FRAME_WIDTH,
    backgroundColor: nodeBackgroundColor(hint),
  } as const;
}

function LabelLines({ label }: { label: string }) {
  return label.split("\n").map((line, i) => (
    <span key={i} className="block leading-snug">
      {line}
    </span>
  ));
}

function DiamondShape({
  data,
  width,
  height,
}: {
  data: FlowNodeData;
  width: number;
  height: number;
}) {
  const inset = FLOW_NODE_DIAMOND_STROKE_WIDTH;
  const midX = width / 2;
  const midY = height / 2;
  const points = `${midX},${inset} ${width - inset},${midY} ${midX},${height - inset} ${inset},${midY}`;
  const fill = nodeBackgroundColor(data.colorHint);

  return (
    <svg
      width={width}
      height={height}
      className="flow-node-diamond block overflow-visible"
      aria-hidden={false}
    >
      <title>{data.shapeType}</title>
      <polygon
        points={points}
        fill={fill}
        stroke={FLOW_NODE_FRAME_STROKE}
        strokeWidth={FLOW_NODE_DIAMOND_STROKE_WIDTH}
        strokeLinejoin="miter"
        strokeMiterlimit={4}
      />
      <foreignObject
        x={width * 0.12}
        y={height * 0.18}
        width={width * 0.76}
        height={height * 0.64}
      >
        <div
          {...({ xmlns: "http://www.w3.org/1999/xhtml" } as Record<string, string>)}
          className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-center text-[11px] font-medium leading-snug text-slate-800"
        >
          <LabelLines label={data.label} />
        </div>
      </foreignObject>
    </svg>
  );
}

function ShapeBody({
  data,
  width,
  height,
}: {
  data: FlowNodeData;
  width: number;
  height: number;
}) {
  const label = <LabelLines label={data.label} />;
  const shapeFrame = frameStyle(data.colorHint);

  const base =
    "flow-shape-body flex h-full w-full flex-col items-center justify-center gap-0.5 border-solid px-2 py-1 text-center text-[11px] font-medium leading-snug text-slate-800";

  switch (data.shapeKind) {
    case "diamond":
      return <DiamondShape data={data} width={width} height={height} />;
    case "rounded":
      return (
        <div
          className={`${base} rounded-2xl`}
          style={shapeFrame}
          title={data.shapeType}
        >
          {label}
        </div>
      );
    case "parallelogram":
      return (
        <div
          className={`${base} flow-node-parallelogram`}
          style={shapeFrame}
          title={data.shapeType}
        >
          {label}
        </div>
      );
    case "manual":
      return (
        <div
          className={`${base} flow-node-manual`}
          style={shapeFrame}
          title={data.shapeType}
        >
          {label}
        </div>
      );
    default:
      return (
        <div
          className={`${base} rounded-sm`}
          style={shapeFrame}
          title={data.shapeType}
        >
          {label}
        </div>
      );
  }
}

function FlowShapeNodeComponent({
  data,
  width,
  height,
}: NodeProps<Node<FlowNodeData>>) {
  const w = width ?? 120;
  const h = height ?? 56;

  return (
    <div
      className="flow-shape-node-root relative overflow-visible"
      style={{ width: w, height: h }}
    >
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
      <ShapeBody data={data} width={w} height={h} />
    </div>
  );
}

export const FlowShapeNode = memo(FlowShapeNodeComponent);
