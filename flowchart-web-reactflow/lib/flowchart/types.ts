/** 表の1行（セル配列） */
export type FlowTableRow = (string | number | null | undefined)[];

export type LayoutConfig = {
  width: number;
  heightMin: number;
  gapV: number;
  gapH: number;
  baseLeft: number;
  baseTop: number;
};

export const DEFAULT_LAYOUT: LayoutConfig = {
  width: 160,
  heightMin: 60,
  gapV: 30,
  gapH: 100,
  baseLeft: 40,
  baseTop: 40,
};

import type { ColorHint } from "./flowColors";

export type ShapeType = "端子" | "処理" | "判断" | "入出力" | "手動入力";

export type FlowNode = {
  id: string;
  type: ShapeType;
  fullText: string;
  destsDown: string[];
  destsRight: string[];
  /** 横位置（8列=Level · 9列=列） */
  level: number;
  /** 9列: 段（layoutGrid 段ベース対応時に Y の正本） */
  tier?: number;
  /** 10列: 表「色」列から（空=normal） */
  colorHint?: ColorHint;
  rowIndex: number;
};

export type ShapeKind =
  | "rectangle"
  | "diamond"
  | "rounded"
  | "parallelogram"
  | "manual";

export type PlacedNode = FlowNode & {
  x: number;
  y: number;
  width: number;
  height: number;
  shapeKind: ShapeKind;
};

export type ConnectorSite = "top" | "bottom" | "left" | "right";

export type FlowEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  direction: "down" | "right";
  sourceSide: ConnectorSite;
  targetSide: ConnectorSite;
  route: "straight" | "elbow";
  label?: "Yes" | "No";
};

export type FlowchartDocument = {
  version: 1;
  /** 例: table-9col-v1 · table-10col-v1（ADR-012 + 色列） */
  schema?: string;
  title?: string;
  table: FlowTableRow[];
  layout: LayoutConfig;
  createdAt: string;
};

export type Bounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type ParseResult = {
  nodes: FlowNode[];
  rowMap: Map<number, FlowNode[]>;
  colCount: number;
};

export type GenerateSuccess = {
  ok: true;
  nodes: FlowNode[];
  placed: PlacedNode[];
  edges: FlowEdge[];
  bounds: Bounds;
};

export type GenerateFailure = {
  ok: false;
  errors: string[];
};

export type GenerateResult = GenerateSuccess | GenerateFailure;
