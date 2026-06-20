"use client";

import { useState } from "react";

import templateStarter from "@/fixtures/template-starter.json";
import { FlowColorLegend } from "@/components/flowchart/FlowColorLegend";
import { FlowTableEditor } from "@/components/flowchart/FlowTableEditor";
import {
  fcBadgeAccent,
  fcBadgeMuted,
  fcBtnAccent,
  fcBtnCancel,
  fcBtnDanger,
  fcBtnDangerOutline,
  fcBtnPrimary,
  fcBtnSecondary,
  fcColorLegend,
  fcDialogPanel,
  fcDialogTitle,
  fcErrorBanner,
  fcLink,
  fcMobileTabActive,
  fcMobileTabGroup,
  fcMobileTabIdle,
  fcNavModuleBtn,
  fcNavModuleBtnState,
  fcSectionTitle,
  fcAuthBar,
  fcAuthBarDevBadge,
  fcAuthBarRoleBadge,
  fcStatusBanner,
  fcStatusBannerError,
  fcStatusBannerNeutral,
  fcStatusBannerSuccess,
  fcWarningBanner,
  fcWarningBannerHint,
  fcWorkspaceShell,
} from "@/components/flowchart/flowchartUiClasses";
import {
  COLOR_HINT_LEGEND_ITEMS,
  FLOW_EDGE_STROKE,
  FLOW_NODE_FRAME_STROKE,
  FLOW_NODE_FRAME_WIDTH,
} from "@/lib/flowchart/flowColors";
import type { FlowchartDocument } from "@/lib/flowchart/types";
import { cn } from "@/lib/utils";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-lg border border-flow-border bg-flow-surface p-4">
      <h2 className={fcSectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className="inline-block h-6 w-6 shrink-0 border-2"
        style={{ backgroundColor: color, borderColor: FLOW_NODE_FRAME_STROKE }}
        aria-hidden
      />
      <span className="font-mono text-flow-text-muted">{label}</span>
      <span className="text-flow-text-muted">{color}</span>
    </div>
  );
}

export function StyleGuideClient() {
  const starter = templateStarter as FlowchartDocument;
  const [table, setTable] = useState(starter.table);
  const [tab, setTab] = useState<"a" | "b">("a");

  return (
    <div className={cn(fcWorkspaceShell, "gap-6 p-6")}>
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          スタイルガイド（開発のみ）
        </h1>
        <p className="text-sm text-flow-text-muted">
          正本: <code className="font-mono text-xs">docs/design-system.md</code>{" "}
          · トークン: <code className="font-mono text-xs">app/globals.css</code>{" "}
          の <code className="font-mono text-xs">--flow-*</code>
        </p>
        <p className="text-xs text-flow-text-muted">
          本番ビルドでは <code className="font-mono">/dev/style</code> は 404
          です。
        </p>
      </header>

      <div className="grid max-w-5xl gap-6">
        <Section title="ボタン（fcBtn*）">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={fcBtnPrimary}>
              Primary
            </button>
            <button type="button" className={fcBtnSecondary}>
              Secondary
            </button>
            <button type="button" className={fcBtnAccent}>
              Accent
            </button>
            <button type="button" className={fcBtnCancel}>
              Cancel
            </button>
            <button type="button" className={fcBtnDanger}>
              Danger
            </button>
            <button type="button" className={fcBtnDangerOutline}>
              Danger outline
            </button>
          </div>
        </Section>

        <Section title="バッジ・リンク">
          <div className="flex flex-wrap items-center gap-2">
            <span className={fcBadgeAccent}>実用版</span>
            <span className={fcBadgeMuted}>プレビューのみ</span>
            <a href="#buttons" className={fcLink}>
              リンク（fcLink）
            </a>
          </div>
        </Section>

        <Section title="バナー">
          <div className={fcWarningBanner}>
            <p className="font-medium">確認（警告）</p>
            <p className={fcWarningBannerHint}>
              警告は再生成を止めません（サンプル文言）
            </p>
          </div>
          <div className={cn(fcErrorBanner, "mt-2")} role="presentation">
            エラー行の例（fcErrorBanner）
          </div>
          <div className="mt-3 space-y-1">
            <p className={cn(fcStatusBanner, fcStatusBannerSuccess)}>
              取込完了（fcStatusBannerSuccess）
            </p>
            <p className={cn(fcStatusBanner, fcStatusBannerError)}>
              取込失敗: 例（fcStatusBannerError）
            </p>
            <p className={cn(fcStatusBanner, fcStatusBannerNeutral)}>
              モジュールを読み込み中…（fcStatusBannerNeutral）
            </p>
          </div>
        </Section>

        <Section title="認証バー（AppAuthBar）">
          <div className={fcAuthBar}>
            <span className={fcAuthBarDevBadge}>認証オフ（ローカル）</span>
            <span>
              user@example.com
              <span className={fcAuthBarRoleBadge}>編集者</span>
            </span>
          </div>
        </Section>

        <Section title="ダイアログパネル（静的）">
          <div className={fcDialogPanel}>
            <h3 className={fcDialogTitle}>タイトル</h3>
            <p className="mt-2 text-sm text-flow-text-muted">本文テキスト</p>
          </div>
        </Section>

        <Section title="モバイルタブ">
          <div className={fcMobileTabGroup} role="tablist">
            <button
              type="button"
              role="tab"
              className={tab === "a" ? fcMobileTabActive : fcMobileTabIdle}
              onClick={() => setTab("a")}
            >
              表
            </button>
            <button
              type="button"
              role="tab"
              className={tab === "b" ? fcMobileTabActive : fcMobileTabIdle}
              onClick={() => setTab("b")}
            >
              図
            </button>
          </div>
        </Section>

        <Section title="左ナビ（動作ボタン）">
          <div className="max-w-xs space-y-1 rounded-md border border-flow-border bg-flow-surface-muted p-2">
            <button
              type="button"
              className={cn(fcNavModuleBtn, fcNavModuleBtnState(true))}
            >
              選択中の動作
            </button>
            <button
              type="button"
              className={cn(fcNavModuleBtn, fcNavModuleBtnState(false))}
            >
              別の動作
            </button>
          </div>
        </Section>

        <Section title="色凡例（FlowColorLegend）">
          <div className="relative h-24 rounded-md border border-flow-border bg-flow-surface-muted">
            <FlowColorLegend />
          </div>
          <div className={cn(fcColorLegend, "mt-2")}>
            浮動しない版（fcColorLegend）
          </div>
        </Section>

        <Section title="キャンバス色（flowColors.ts · 変更は別レイヤ）">
          <div className="grid gap-2 sm:grid-cols-2">
            <Swatch label="FLOW_EDGE_STROKE" color={FLOW_EDGE_STROKE} />
            <Swatch
              label="FLOW_NODE_FRAME_STROKE"
              color={FLOW_NODE_FRAME_STROKE}
            />
            {COLOR_HINT_LEGEND_ITEMS.map(({ hint, label, fill }) => (
              <Swatch key={hint} label={label} color={fill} />
            ))}
          </div>
          <p className="text-xs text-flow-text-muted">
            ノード枠太さ: {FLOW_NODE_FRAME_WIDTH}px（VISUAL_DESIGN_RULES §2）
          </p>
        </Section>

        <Section title="表エディタ（FlowTableEditor · 2行サンプル）">
          <div className="flex h-80 min-h-0 flex-col">
            <FlowTableEditor
              table={table.slice(0, 2)}
              onChange={(next) => setTable(next)}
              tableSchema={starter.schema}
              errorRowIndices={new Set([1])}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}
