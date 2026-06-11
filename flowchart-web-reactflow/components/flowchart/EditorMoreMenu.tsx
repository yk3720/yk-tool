"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type SampleOption = {
  key: string;
  label: string;
};

type EditorMoreMenuProps = {
  readOnly: boolean;
  workspaceMode: boolean;
  moduleSelected: boolean;
  canExport: boolean;
  exportDisabledTitle?: string;
  clearDraftDisabled: boolean;
  clearDraftTitle: string;
  pinOffline?: { pinned: boolean; onToggle: () => void };
  starters: SampleOption[];
  samples: SampleOption[];
  onApplyStarter: (key: string) => void;
  onPreviewSample: (key: string) => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onClearDraft: () => void;
  importBundle?: {
    disabled: boolean;
    disabledTitle?: string;
    onSelectFile: (file: File) => void;
  };
};

function MenuItem({
  children,
  disabled,
  destructive,
  title,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      title={disabled ? title : undefined}
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        destructive
          ? "text-red-700 hover:bg-red-50"
          : "text-slate-800 hover:bg-slate-100"
      )}
    >
      {children}
    </button>
  );
}

function MenuSection({
  label,
  hint,
  isFirst = false,
}: {
  label: string;
  hint?: string;
  isFirst?: boolean;
}) {
  return (
    <>
      {!isFirst ? (
        <div
          className="my-1 border-t border-slate-200"
          role="separator"
          aria-hidden
        />
      ) : null}
      <p className="px-3 pb-0.5 pt-1.5 text-xs font-semibold text-slate-600">
        {label}
      </p>
      {hint ? (
        <p className="px-3 pb-1 text-xs leading-snug text-slate-500">{hint}</p>
      ) : null}
    </>
  );
}

export function EditorMoreMenu({
  readOnly,
  workspaceMode,
  moduleSelected,
  canExport,
  exportDisabledTitle,
  clearDraftDisabled,
  clearDraftTitle,
  pinOffline,
  starters,
  samples,
  onApplyStarter,
  onPreviewSample,
  onExportPng,
  onExportSvg,
  onClearDraft,
  importBundle,
}: EditorMoreMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const closeAnd = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  const starterHint = moduleSelected
    ? "選択中モジュールの表を雛形で始めます（編集中は確認）"
    : undefined;

  const sampleHint = moduleSelected
    ? "例はプレビューのみ。保存する場合は「モジュールに適用」"
    : "保存せずに例の表と図を表示";

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        その他
        <ChevronDown
          className={cn(
            "size-4 text-slate-500 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="その他の操作"
          className="absolute right-0 top-full z-30 mt-1 min-w-[16rem] rounded-md border border-slate-200 bg-white py-1 shadow-lg"
        >
          {!readOnly ? (
            <>
              <MenuSection label="始め方" hint={starterHint} isFirst />
              {starters.map((starter) => (
                <MenuItem
                  key={starter.key}
                  onClick={() => closeAnd(() => onApplyStarter(starter.key))}
                >
                  {starter.label}
                </MenuItem>
              ))}

              <MenuSection label="サンプル（例）" hint={sampleHint} />
              {samples.map((sample) => (
                <MenuItem
                  key={sample.key}
                  onClick={() => closeAnd(() => onPreviewSample(sample.key))}
                >
                  {sample.label}
                </MenuItem>
              ))}
            </>
          ) : null}

          <MenuSection label="出力" isFirst={readOnly} />
          <MenuItem
            disabled={!canExport}
            title={exportDisabledTitle}
            onClick={() => closeAnd(onExportPng)}
          >
            PNG
          </MenuItem>
          <MenuItem
            disabled={!canExport}
            title={exportDisabledTitle}
            onClick={() => closeAnd(onExportSvg)}
          >
            SVG
          </MenuItem>

          {pinOffline ? (
            <>
              <MenuSection label="オフライン" />
              <MenuItem onClick={() => closeAnd(pinOffline.onToggle)}>
                {pinOffline.pinned
                  ? "オフライン保存を解除"
                  : "オフライン用に保存"}
              </MenuItem>
            </>
          ) : null}

          {!readOnly && workspaceMode && importBundle ? (
            <>
              <MenuSection label="装置取込" isFirst={readOnly} />
              <MenuItem
                disabled={importBundle.disabled}
                onClick={() => {
                  if (importBundle.disabled) return;
                  importInputRef.current?.click();
                }}
              >
                <span title={importBundle.disabledTitle ?? undefined}>
                  import.json を取込…
                </span>
              </MenuItem>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                data-testid="import-bundle-file"
                aria-hidden
                tabIndex={-1}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    closeAnd(() => importBundle.onSelectFile(file));
                  }
                  e.target.value = "";
                }}
              />
            </>
          ) : null}

          {!workspaceMode ? (
            <>
              <MenuSection label="下書き" />
              <MenuItem
                destructive
                disabled={clearDraftDisabled}
                onClick={() => closeAnd(onClearDraft)}
              >
                <span title={clearDraftTitle}>下書きを削除</span>
              </MenuItem>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
