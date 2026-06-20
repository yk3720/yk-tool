import type { FitViewOptions } from "@xyflow/react";

import { cn } from "@/lib/utils";

/** 表ペイン : プレビュー = 2fr : 3fr（12カラムではなく比率グリッド） */
export const FC_WORKSPACE_MAIN_GRID = "lg:grid-cols-[2fr_3fr]";

/* ── サーフェス・枠（@theme flow-* · globals.css） ── */

export const fcSurface = "bg-flow-surface text-flow-text";
export const fcSurfaceMuted = "bg-flow-surface-muted";
export const fcBorderB = "border-b border-flow-border";
export const fcBorderR = "border-r border-flow-border";
export const fcBorderStrong = "border-flow-border-strong";

/* ── アクセシビリティ（A11Y_RULES §4 · flowchartUiClasses SSOT） ── */

/** WCAG 2.4.7 — chrome 共通フォーカスリング */
export const fcFocusRing =
  "outline-none focus-visible:outline-3 focus-visible:outline-flow-accent focus-visible:outline-offset-2";

/** WCAG 2.5.8 — 最小タップ領域 24px（`min-h-6` / `min-w-6`） */
export const fcTargetMin =
  "inline-flex min-h-6 min-w-6 items-center justify-center";

/* ── ボタン ── */

export const fcBtn = cn(
  fcFocusRing,
  fcTargetMin,
  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
);

export const fcBtnPrimary = cn(
  fcBtn,
  "bg-flow-accent text-white hover:bg-flow-accent-hover"
);

export const fcBtnSecondary = cn(
  fcBtn,
  "border border-flow-border-strong text-flow-text-body hover:bg-flow-surface-muted"
);

export const fcBtnAccent = cn(
  fcBtn,
  "border border-flow-accent-muted-border bg-flow-accent-muted text-flow-accent-muted-text hover:bg-flow-accent-selected-bg"
);

export const fcBtnCancel = fcBtnSecondary;

export const fcBtnDanger = cn(
  fcBtn,
  "bg-flow-danger text-white hover:bg-flow-danger-hover"
);

export const fcBtnDangerOutline = cn(
  fcBtn,
  "border border-flow-danger-border text-flow-danger-text hover:bg-flow-danger-muted"
);

/** CSV 貼り付けパネル内の小さめボタン */
export const fcBtnCompactPrimary = cn(
  fcBtn,
  "bg-flow-accent px-2.5 py-1 text-xs text-white hover:bg-flow-accent-hover disabled:opacity-40"
);

export const fcBtnCompactSecondary = cn(
  fcFocusRing,
  fcTargetMin,
  "cursor-pointer rounded-md border border-flow-border-input bg-flow-surface px-2.5 py-1 text-xs font-medium text-flow-text-body hover:bg-flow-surface-subtle"
);

export const fcBtnCompactWarning = cn(
  "rounded-md bg-flow-warning px-2.5 py-1 text-xs font-medium text-white hover:bg-flow-warning-emphasis"
);

/* ── ダイアログ ── */

export const fcDialogOverlay =
  "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4";

export const fcDialogPanel = cn(
  "w-full max-w-md rounded-lg border border-flow-border bg-flow-surface p-5 shadow-xl"
);

export const fcDialogTitle = "text-base font-semibold text-flow-text";
export const fcDialogBody = "mt-2 text-sm text-flow-text-muted";

/* ── バナー・強調 ── */

export const fcStatusBanner = "px-3 py-2 text-sm";

export const fcWarningBanner = cn(
  fcBorderB,
  "bg-flow-warning-bg px-4 py-2 text-sm text-flow-warning-text"
);

export const fcWarningBannerHint =
  "mt-0.5 text-xs text-flow-warning-text-subtle";

export const fcWarningCallout = cn(
  "rounded-md border border-flow-warning-border-strong bg-flow-warning-bg px-2.5 py-2 text-xs text-flow-warning-text"
);

export const fcErrorBanner = cn(
  fcBorderB,
  "bg-flow-danger-muted px-4 py-2 text-sm text-flow-danger-text"
);

export const fcErrorBannerLink = cn(
  fcFocusRing,
  "text-left underline hover:text-flow-danger-text-emphasis"
);

export const fcWarningBannerLink = cn(
  fcFocusRing,
  "text-left underline hover:text-flow-warning-text-emphasis"
);

export const fcStatusBannerSuccess = cn(
  fcBorderB,
  "border-flow-success-border bg-flow-success-bg text-flow-success-text"
);

export const fcStatusBannerError = cn(
  fcBorderB,
  "bg-flow-danger-muted text-flow-danger-text"
);

export const fcStatusBannerNeutral = cn(
  fcBorderB,
  "bg-flow-warning-bg text-flow-warning-text"
);

/* ── 認証バー（ワークスペース chrome） ── */

export const fcAuthBar = cn(
  fcBorderB,
  "flex flex-wrap items-center gap-3 bg-flow-surface-muted px-3 py-2 text-xs text-flow-text-muted"
);

export const fcAuthBarDevBadge = cn(
  "rounded bg-flow-warning-bg px-2 py-0.5 font-medium text-flow-warning-text"
);

export const fcAuthBarRoleBadge =
  "ml-2 rounded bg-flow-surface-subtle px-1.5 py-0.5 font-medium text-flow-text-body";

export const fcAuthBarAdminLink = cn(
  fcFocusRing,
  fcTargetMin,
  "rounded border border-flow-border-strong px-2 py-1 hover:bg-flow-surface"
);

export const fcAuthBarSignOutBtn = cn(
  fcFocusRing,
  fcTargetMin,
  "rounded border border-flow-border-strong px-2 py-1 hover:bg-flow-surface"
);

export const fcModuleLoadingOverlay =
  "absolute inset-0 z-20 flex items-center justify-center bg-flow-surface/85 text-sm font-medium text-flow-text-muted";

export const fcStaleRing = "ring-2 ring-flow-warning-ring ring-offset-1";
export const fcStaleRingInset = "ring-2 ring-inset ring-flow-warning-ring";

export const fcStaleOverlay =
  "pointer-events-none absolute inset-0 flex items-start justify-center bg-flow-warning-bg/70 p-4";

export const fcStaleCallout = cn(
  "pointer-events-auto max-w-md rounded-md border border-flow-warning-border-strong bg-flow-surface px-3 py-2 text-center text-sm text-flow-warning-text shadow-sm"
);

/* ── リンク・バッジ ── */

export const fcLink = cn(
  fcFocusRing,
  "font-medium text-flow-accent underline hover:text-flow-accent-emphasis"
);

export const fcBadgeAccent =
  "rounded-full bg-flow-accent-selected-bg px-2 py-0.5 text-xs font-medium text-flow-accent-muted-text";

export const fcBadgeMuted =
  "rounded bg-flow-surface-subtle px-2 py-0.5 text-xs text-flow-text-muted";

/* ── モバイルタブ ── */

export const fcMobileTabBase = cn(
  fcFocusRing,
  fcTargetMin,
  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
);

export const fcMobileTabGroup = cn(
  "inline-flex rounded-md border border-flow-border-strong p-0.5 text-xs"
);

export const fcMobileTabActive = cn(
  fcFocusRing,
  fcTargetMin,
  "rounded-md bg-flow-nav-active px-3 py-1.5 text-white"
);

export const fcMobileTabIdle = cn(
  fcMobileTabBase,
  "text-flow-text-muted hover:bg-flow-surface-muted"
);

/* ── 左ナビ ── */

export const fcNavSelect = cn(
  fcFocusRing,
  "w-full rounded-md border border-flow-border-strong bg-flow-surface px-3 py-1.5 text-sm text-flow-text-body"
);

export const fcNavUnitToggle = cn(
  fcFocusRing,
  fcTargetMin,
  "flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-3 py-1.5 text-left text-sm font-medium text-flow-text-body hover:bg-flow-surface-subtle"
);

export const fcNavModuleBtn = cn(
  fcFocusRing,
  fcTargetMin,
  "min-w-0 flex-1 rounded-md px-3 py-1.5 text-left text-sm transition-colors"
);

export function fcNavModuleBtnState(selected: boolean): string {
  return selected
    ? "border-l-2 border-flow-accent bg-flow-accent-selected-bg pl-[calc(0.75rem-2px)] font-medium text-flow-accent-selected-text"
    : "text-flow-text-body hover:bg-flow-surface-subtle";
}

export const fcNavAside = cn(
  "flex w-full shrink-0 flex-col border-r border-flow-border bg-flow-surface-muted lg:w-[min(20%,240px)] lg:min-w-[180px]"
);

export const fcNavAsideCollapsed = cn(
  "flex w-12 shrink-0 flex-col items-center border-r border-flow-border bg-flow-surface-muted py-3"
);

export const fcNavHeader = cn(
  "flex items-center justify-between gap-2 border-b border-flow-border px-3 py-2"
);

export const fcNavTitle = "truncate text-sm font-semibold text-flow-text-body";

export const fcNavIconBtn = cn(
  fcFocusRing,
  fcTargetMin,
  "rounded-md p-1.5 text-flow-text-muted hover:bg-flow-surface-subtle lg:hidden"
);

export const fcNavCollapseBtn = cn(
  fcFocusRing,
  fcTargetMin,
  "rounded-md p-2 text-flow-text-muted hover:bg-flow-surface-subtle"
);

export const fcNavDeleteBtn = cn(
  fcFocusRing,
  fcTargetMin,
  "shrink-0 rounded-md p-1.5 text-flow-text-muted hover:bg-flow-danger-muted hover:text-flow-danger-text"
);

export const fcNavChevron = "size-4 shrink-0 text-flow-text-muted";

export const fcNavLabel = "text-xs font-medium text-flow-text-muted";

/* ── その他メニュー ── */

export const fcMenuDropdown = cn(
  "absolute right-0 top-full z-30 mt-1 min-w-[16rem] rounded-md border border-flow-border bg-flow-surface py-1 shadow-lg"
);

export const fcMenuItem = cn(
  fcFocusRing,
  fcTargetMin,
  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-flow-text-body hover:bg-flow-surface-subtle"
);

export const fcMenuItemDanger = cn(
  fcFocusRing,
  fcTargetMin,
  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-flow-danger-text hover:bg-flow-danger-muted"
);

export const fcMenuSectionTitle =
  "px-3 pb-0.5 pt-1.5 text-xs font-semibold text-flow-text-muted";

export const fcMenuSectionHint =
  "px-3 pb-1 text-xs leading-snug text-flow-text-muted";

export const fcMenuDivider = "my-1 border-t border-flow-border";

export const fcMenuChevron = "size-4 text-flow-text-muted transition-transform";

/* ── ペイン・セクション ── */

export const fcPaneHeader = "shrink-0 border-b border-flow-border px-4 py-2";

export const fcSectionTitle = "text-sm font-medium text-flow-text-body";

export const fcWorkspaceShell =
  "flex min-h-screen flex-col bg-flow-surface text-flow-text";

export const fcWorkspaceLoading =
  "flex min-h-screen items-center justify-center bg-flow-surface text-flow-text-body";

/* ── プレビュー領域 ── */

export const fcPreviewCanvasLg = cn(
  "h-full min-h-[280px] w-full bg-flow-surface-muted lg:min-h-0 lg:border-0 lg:border-l lg:border-flow-border"
);

export const fcPreviewCanvasMd = cn(
  "h-full min-h-[420px] w-full rounded-lg border border-flow-border bg-flow-surface-muted"
);

/** プレビュー canvas — keyboard pan/zoom フォーカス面 */
export const fcCanvasA11y = cn("relative outline-none", fcFocusRing);

export const fcEmptyState = cn(
  "flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-flow-border-strong bg-flow-surface-muted p-6 text-center text-sm text-flow-text-muted"
);

export const fcEmptyStateLg = cn(
  "flex min-h-[280px] flex-1 flex-col items-center justify-center gap-2 border border-dashed border-flow-border-strong bg-flow-surface-muted text-sm text-flow-text-muted lg:min-h-0 lg:border-0 lg:border-l"
);

export const fcEmptyStateMd = cn(
  "flex min-h-[420px] flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-flow-border-strong bg-flow-surface-muted text-sm text-flow-text-muted"
);

export const fcEmptyHint = "text-xs text-flow-text-muted";

/* ── CSV / 表ペイン ── */

export const fcPastePanel = cn(
  "rounded-md border border-dashed border-flow-border-strong bg-flow-surface-muted/80 p-2"
);

export const fcPastePanelTitle = "mb-1 text-xs font-medium text-flow-text-body";

export const fcPasteTextarea = cn(
  "w-full resize-y rounded border border-flow-border-strong p-2 font-mono text-xs"
);

export const fcStatusText = "text-flow-text-muted";
export const fcStatusStaleLabel = "mr-2 font-medium text-flow-warning";
export const fcStatusDraftHint = "ml-2 text-xs text-flow-text-muted";

/* ── 表エディタ ── */

export const fcTableHelpDetails = cn(
  "rounded-md border border-flow-border bg-flow-surface-muted/90 px-2 py-1 text-xs text-flow-text-muted"
);

export const fcTableHelpSummary = cn(
  fcFocusRing,
  "cursor-pointer font-medium text-flow-text-body"
);

export const fcTableAddRowBtn = cn(
  fcFocusRing,
  fcTargetMin,
  "rounded-md border border-flow-border-strong px-2.5 py-1 text-xs font-medium hover:bg-flow-surface-muted"
);

export const fcTableMeta = "text-xs text-flow-text-muted";

export const fcTableScroll = cn(
  "min-h-0 flex-1 overflow-auto scroll-pt-10 rounded-md border border-flow-border-strong"
);

export const fcTable = "w-full min-w-[640px] border-collapse text-xs";

export const fcTableHead = "sticky top-0 z-10 bg-flow-surface-subtle";

export const fcTableHeadCell = cn(
  "border-b border-flow-border px-2 py-1.5 text-left font-medium text-flow-text-body"
);

export const fcTableHeadCellIndex = cn(
  "w-10 border-b border-flow-border px-1 py-1.5 text-center font-medium text-flow-text-muted"
);

export const fcTableHeadCellAction = cn(
  "w-16 border-b border-flow-border px-1 py-1.5"
);

export const fcTableHeadHelpMark = "ml-0.5 font-normal text-flow-text-muted";

export const fcTableRow =
  "odd:bg-flow-surface even:bg-flow-surface-muted/80 hover:bg-flow-accent-muted/40";

export const fcTableRowError =
  "bg-flow-danger-muted/90 ring-1 ring-inset ring-flow-danger-border";

export const fcTableCell = "border-b border-flow-border/60 px-0.5 py-0.5";

export const fcTableCellIndex = cn(
  fcTableCell,
  "px-1 text-center text-flow-text-muted"
);

export const fcTableCellInput = cn(
  fcFocusRing,
  "scroll-mt-10 w-full rounded border-0 bg-transparent px-1.5 py-1 text-xs focus:bg-flow-surface disabled:cursor-default disabled:opacity-90"
);

export const fcTableCellInputMono = cn(fcTableCellInput, "font-mono");

export const fcTableDeleteBtn = cn(
  fcFocusRing,
  fcTargetMin,
  "rounded px-1 text-xs text-flow-danger hover:bg-flow-danger-muted disabled:cursor-not-allowed disabled:opacity-30"
);

/* ── プレビュー凡例（キャンバス上の chrome） ── */

export const fcColorLegend = cn(
  "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-flow-border bg-flow-surface/95 px-2.5 py-1.5 text-[10px] text-flow-text-body shadow-sm"
);

export const fcColorLegendFloating = cn(
  fcColorLegend,
  "pointer-events-none absolute bottom-2 left-2 z-10"
);

/** ノードが少ないときは下余白を多めにしてプレビュー内で上寄りに見えないよう調整 */
export function fcFitViewOptions(nodeCount: number): FitViewOptions {
  const padding =
    nodeCount <= 5
      ? { top: 0.08, bottom: 0.32, left: 0.16, right: 0.16 }
      : { top: 0.1, bottom: 0.18, left: 0.15, right: 0.15 };
  return { padding, duration: 200, maxZoom: 1.25 };
}
