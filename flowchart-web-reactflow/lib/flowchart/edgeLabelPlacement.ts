import { FLOW_EDGE_LABEL_GAP } from "./flowColors";
import type { FlowEdge } from "./types";

export type DecisionBranch = "yes" | "no";

export type EdgeLabelVariant = "halo" | "pill";

export type EdgeLabelPlacement = {
  x: number;
  y: number;
  /** CSS transform for EdgeLabelRenderer (includes translate to x,y) */
  transform: string;
  variant: EdgeLabelVariant;
};

export function branchFromEdgeLabel(
  label: FlowEdge["label"]
): DecisionBranch | undefined {
  if (label === "Yes") return "yes";
  if (label === "No") return "no";
  return undefined;
}

/** Yes: 出口すぐの縦線の右。No: エルボー縦セグメントの右。 */
export function placementForEdgeLabel(
  labelX: number,
  labelY: number,
  branch: DecisionBranch | undefined,
  direction: FlowEdge["direction"] | undefined,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): EdgeLabelPlacement {
  const gap = FLOW_EDGE_LABEL_GAP;

  if (branch === "yes" && direction === "down") {
    const verticalLegX = Math.abs(sourceX - targetX) < 8 ? sourceX : labelX;
    const x = verticalLegX + gap;
    const y = sourceY + Math.max(14, (targetY - sourceY) * 0.12);
    return {
      x,
      y,
      transform: `translate(0%, -50%) translate(${x}px, ${y}px)`,
      variant: "halo",
    };
  }

  if (branch === "no" && direction === "right") {
    const legX = Math.max(sourceX, targetX, labelX);
    const x = legX + gap;
    const y = sourceY + (targetY - sourceY) * 0.55;
    return {
      x,
      y,
      transform: `translate(0%, -50%) translate(${x}px, ${y}px)`,
      variant: "halo",
    };
  }

  return {
    x: labelX,
    y: labelY,
    transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
    variant: "pill",
  };
}
