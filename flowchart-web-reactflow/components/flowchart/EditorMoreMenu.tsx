"use client";

import { ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

import {
  fcBtnSecondary,
  fcMenuChevron,
  fcMenuDivider,
  fcMenuDropdown,
  fcMenuItem,
  fcMenuItemDanger,
  fcMenuSectionHint,
  fcMenuSectionTitle,
} from "./flowchartUiClasses";

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
  resetFlow?: {
    onRequestReset: () => void;
  };
};

function MenuItem({
  children,
  disabled,
  destructive,
  title,
  onClick,
}: {
  children: ReactNode;
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
      aria-disabled={disabled ? true : undefined}
      onClick={onClick}
      className={cn(destructive ? fcMenuItemDanger : fcMenuItem, "flex gap-0")}
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
        <div className={fcMenuDivider} role="separator" aria-hidden />
      ) : null}
      <p className={fcMenuSectionTitle}>{label}</p>
      {hint ? <p className={fcMenuSectionHint}>{hint}</p> : null}
    </>
  );
}

function getEnabledMenuItems(menu: HTMLElement | null): HTMLButtonElement[] {
  if (!menu) return [];
  return Array.from(
    menu.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"]:not([disabled])'
    )
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
  resetFlow,
}: EditorMoreMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const menuId = useId();

  const closeMenu = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      closeMenu(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, closeMenu]);

  useEffect(() => {
    if (!open) return;
    const first = getEnabledMenuItems(menuRef.current)[0];
    first?.focus();
  }, [open]);

  const focusMenuItem = useCallback((index: number) => {
    const items = getEnabledMenuItems(menuRef.current);
    if (items.length === 0) return;
    const next = ((index % items.length) + items.length) % items.length;
    items[next]?.focus();
  }, []);

  const handleMenuKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const items = getEnabledMenuItems(menuRef.current);
      const currentIndex = items.findIndex(
        (el) => el === document.activeElement
      );

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          closeMenu();
          break;
        case "ArrowDown":
          e.preventDefault();
          focusMenuItem(currentIndex < 0 ? 0 : currentIndex + 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          focusMenuItem(currentIndex < 0 ? items.length - 1 : currentIndex - 1);
          break;
        case "Home":
          e.preventDefault();
          focusMenuItem(0);
          break;
        case "End":
          e.preventDefault();
          focusMenuItem(items.length - 1);
          break;
        case "Tab":
          closeMenu(false);
          break;
        default:
          break;
      }
    },
    [closeMenu, focusMenuItem]
  );

  const handleTriggerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        if (
          !open &&
          (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")
        ) {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
          }
          setOpen(true);
        }
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        closeMenu();
      }
    },
    [open, closeMenu]
  );

  const closeAnd = (fn: () => void) => {
    fn();
    closeMenu();
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
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={handleTriggerKeyDown}
        className={cn(fcBtnSecondary, "inline-flex items-center gap-1")}
      >
        その他
        <ChevronDown
          className={cn(fcMenuChevron, open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="その他の操作"
          className={fcMenuDropdown}
          onKeyDown={handleMenuKeyDown}
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
                title={importBundle.disabledTitle}
                onClick={() => {
                  if (importBundle.disabled) return;
                  importInputRef.current?.click();
                }}
              >
                import.json を取込…
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

          {!readOnly && workspaceMode && moduleSelected && resetFlow ? (
            <>
              <MenuSection label="フロー" />
              <MenuItem
                destructive
                onClick={() => closeAnd(resetFlow.onRequestReset)}
              >
                フローを雛形にリセット…
              </MenuItem>
            </>
          ) : null}

          {!workspaceMode ? (
            <>
              <MenuSection label="下書き" />
              <MenuItem
                destructive
                disabled={clearDraftDisabled}
                title={clearDraftTitle}
                onClick={() => closeAnd(onClearDraft)}
              >
                下書きを削除
              </MenuItem>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
