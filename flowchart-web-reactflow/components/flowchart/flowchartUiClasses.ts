import type { FitViewOptions } from "@xyflow/react";

import { cn } from "@/lib/utils";

/** 表ペイン : プレビュー = 2fr : 3fr（12カラムではなく比率グリッド） */
export const FC_WORKSPACE_MAIN_GRID = "lg:grid-cols-[2fr_3fr]";

/** ツールバー・ダイアログ共通の操作部品ベース */
export const fcBtn =
  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export const fcBtnPrimary = cn(
  fcBtn,
  "bg-blue-600 text-white hover:bg-blue-700"
);

export const fcBtnSecondary = cn(
  fcBtn,
  "border border-slate-300 text-slate-700 hover:bg-slate-50"
);

export const fcBtnAccent = cn(
  fcBtn,
  "border border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100"
);

export const fcBtnCancel = cn(
  fcBtn,
  "border border-slate-300 text-slate-800 hover:bg-slate-50"
);

export const fcBtnDanger = cn(fcBtn, "bg-red-600 text-white hover:bg-red-700");

export const fcBtnDangerOutline = cn(
  fcBtn,
  "border border-red-200 text-red-700 hover:bg-red-50"
);

export const fcStatusBanner = "px-3 py-2 text-sm";

export const fcMobileTabBase =
  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";

export const fcNavSelect = cn(
  "w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800"
);

export const fcNavUnitToggle = cn(
  "flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-3 py-1.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-100"
);

export const fcNavModuleBtn = cn(
  "min-w-0 flex-1 rounded-md px-3 py-1.5 text-left text-sm transition-colors"
);

export function fcNavModuleBtnState(selected: boolean): string {
  return selected
    ? "border-l-2 border-blue-600 bg-blue-100 pl-[calc(0.75rem-2px)] font-medium text-blue-900"
    : "text-slate-700 hover:bg-slate-100";
}

/** ノードが少ないときは下余白を多めにしてプレビュー内で上寄りに見えないよう調整 */
export function fcFitViewOptions(nodeCount: number): FitViewOptions {
  const padding =
    nodeCount <= 5
      ? { top: 0.08, bottom: 0.32, left: 0.16, right: 0.16 }
      : { top: 0.1, bottom: 0.18, left: 0.15, right: 0.15 };
  return { padding, duration: 200, maxZoom: 1.25 };
}
