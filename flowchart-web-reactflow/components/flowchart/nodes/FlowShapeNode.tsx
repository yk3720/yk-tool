"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
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

/** 表 ID — プレビュー専用（exportImageFilter で PNG/SVG から除外） */
function NodeIdBadge({ id }: { id: string }) {
  return (
    <span
      data-testid="flow-node-id"
      className="flow-node-id pointer-events-none absolute -left-1 -top-2.5 z-10 rounded-sm border-2 border-slate-200 bg-white px-1 text-[9px] font-bold leading-none tabular-nums text-slate-500 shadow-sm"
    >
      {id}
    </span>
  );
}

function polygonPoints(
  width: number,
  height: number,
  verts: readonly [number, number][]
): string {
  return verts
    .map(([xPct, yPct]) => `${(xPct / 100) * width},${(yPct / 100) * height}`)
    .join(" ");
}

/** 入出力 — clip-path+border だと角が途切れるため SVG stroke */
const PARALLELOGRAM_VERTS: [number, number][] = [
  [12, 0],
  [100, 0],
  [88, 100],
  [0, 100],
];

/** 手動入力 */
const MANUAL_VERTS: [number, number][] = [
  [8, 0],
  [92, 0],
  [100, 100],
  [0, 100],
];

function SlantedPolygonShape({
  data,
  width,
  height,
  verts,
  className,
}: {
  data: FlowNodeData;
  width: number;
  height: number;
  verts: readonly [number, number][];
  className: string;
}) {
  const fill = nodeBackgroundColor(data.colorHint);

  return (
    <svg
      width={width}
      height={height}
      className={`${className} block overflow-visible`}
      aria-hidden={false}
    >
      <title>{data.shapeType}</title>
      <polygon
        points={polygonPoints(width, height, verts)}
        fill={fill}
        stroke={FLOW_NODE_FRAME_STROKE}
        strokeWidth={FLOW_NODE_DIAMOND_STROKE_WIDTH}
        strokeLinejoin="miter"
        strokeMiterlimit={4}
      />
      <foreignObject
        x={width * 0.1}
        y={height * 0.12}
        width={width * 0.8}
        height={height * 0.76}
      >
        <div
          {...({ xmlns: "http://www.w3.org/1999/xhtml" } as Record<
            string,
            string
          >)}
          className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-center text-[11px] font-medium leading-snug text-slate-800"
        >
          <LabelLines label={data.label} />
        </div>
      </foreignObject>
    </svg>
  );
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
          {...({ xmlns: "http://www.w3.org/1999/xhtml" } as Record<
            string,
            string
          >)}
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
        <SlantedPolygonShape
          data={data}
          width={width}
          height={height}
          verts={PARALLELOGRAM_VERTS}
          className="flow-node-parallelogram"
        />
      );
    case "manual":
      return (
        <SlantedPolygonShape
          data={data}
          width={width}
          height={height}
          verts={MANUAL_VERTS}
          className="flow-node-manual"
        />
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
  id,
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
      <NodeIdBadge id={id} />
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
