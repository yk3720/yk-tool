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
  canExport: boolean;
  clearDraftDisabled: boolean;
  clearDraftTitle: string;
  pinOffline?: { pinned: boolean; onToggle: () => void };
  samples: SampleOption[];
  onLoadSample: (key: string) => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onClearDraft: () => void;
};

function MenuItem({
  children,
  disabled,
  destructive,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        destructive
          ? "text-red-700 hover:bg-red-50"
          : "text-slate-800 hover:bg-slate-100",
      )}
    >
      {children}
    </button>
  );
}

function MenuSection({ label }: { label: string }) {
  return (
    <p className="px-3 pb-0.5 pt-2 text-xs font-medium text-slate-500">{label}</p>
  );
}

export function EditorMoreMenu({
  readOnly,
  workspaceMode,
  canExport,
  clearDraftDisabled,
  clearDraftTitle,
  pinOffline,
  samples,
  onLoadSample,
  onExportPng,
  onExportSvg,
  onClearDraft,
}: EditorMoreMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
          className={cn("size-4 text-slate-500 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="その他の操作"
          className="absolute right-0 top-full z-30 mt-1 min-w-[12rem] rounded-md border border-slate-200 bg-white py-1 shadow-lg"
        >
          <MenuSection label="出力" />
          <MenuItem
            disabled={!canExport}
            onClick={() => closeAnd(onExportPng)}
          >
            PNG
          </MenuItem>
          <MenuItem
            disabled={!canExport}
            onClick={() => closeAnd(onExportSvg)}
          >
            SVG
          </MenuItem>

          {pinOffline ? (
            <>
              <MenuSection label="オフライン" />
              <MenuItem onClick={() => closeAnd(pinOffline.onToggle)}>
                {pinOffline.pinned ? "オフライン保存を解除" : "オフライン用に保存"}
              </MenuItem>
            </>
          ) : null}

          {!readOnly ? (
            <>
              <MenuSection label="サンプル" />
              {samples.map((sample) => (
                <MenuItem
                  key={sample.key}
                  onClick={() => closeAnd(() => onLoadSample(sample.key))}
                >
                  {sample.label}
                </MenuItem>
              ))}
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
