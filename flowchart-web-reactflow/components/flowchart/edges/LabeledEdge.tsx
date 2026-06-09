"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from "@xyflow/react";
import { memo } from "react";
import {
  branchFromEdgeLabel,
  placementForEdgeLabel,
} from "@/lib/flowchart/edgeLabelPlacement";
import type { FlowEdgeData } from "@/lib/flowchart/toReactFlow";

function LabeledEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  style,
  markerEnd,
  data,
}: EdgeProps) {
  const edgeData = data as FlowEdgeData | undefined;
  const route = edgeData?.route ?? "elbow";
  const [edgePath, labelX, labelY] =
    route === "straight"
      ? getStraightPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        })
      : getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: 8,
        });

  const text =
    edgeData?.edgeLabel ?? (typeof label === "string" ? label : undefined);
  const branch =
    edgeData?.branch ??
    (text === "Yes" || text === "No" ? branchFromEdgeLabel(text) : undefined);
  const direction =
    edgeData?.direction ??
    (branch === "yes" ? "down" : branch === "no" ? "right" : undefined);
  const placement = text
    ? placementForEdgeLabel(
        labelX,
        labelY,
        branch,
        direction,
        sourceX,
        sourceY,
        targetX,
        targetY
      )
    : null;

  const labelClassName =
    placement?.variant === "halo"
      ? "nodrag nopan whitespace-nowrap bg-transparent px-0.5 text-[10px] font-bold leading-none text-slate-900"
      : "nodrag nopan whitespace-nowrap rounded-sm border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold leading-none text-slate-900 shadow-sm";

  const labelStyle =
    placement?.variant === "halo"
      ? {
          textShadow:
            "1px 0 0 #fff, -1px 0 0 #fff, 0 1px 0 #fff, 0 -1px 0 #fff, 2px 0 0 #fff, -2px 0 0 #fff",
        }
      : undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        markerEnd={markerEnd}
        labelShowBg={false}
      />
      {text && placement ? (
        <EdgeLabelRenderer>
          <div
            data-edge-label-branch={branch}
            data-edge-label-text={text}
            className={labelClassName}
            style={{
              position: "absolute",
              transform: placement.transform,
              pointerEvents: "all",
              ...labelStyle,
            }}
          >
            {text}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const LabeledEdge = memo(LabeledEdgeComponent);
