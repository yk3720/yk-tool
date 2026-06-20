"use client";

import { useEffect, useRef, type ReactNode } from "react";

import {
  fcBtnCancel,
  fcBtnDanger,
  fcDialogOverlay,
  fcDialogPanel,
  fcDialogTitle,
} from "./flowchartUiClasses";

function getFocusables(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  );
}

type FlowAlertDialogProps = {
  open: boolean;
  titleId: string;
  title: ReactNode;
  children: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  cancelDisabled?: boolean;
  confirmDisabled?: boolean;
  confirmTestId?: string;
  /** false のときオーバーレイクリックで閉じない（pending 中） */
  overlayDismiss?: boolean;
};

/** alertdialog — Escape · Tab focus trap · キャンセルに初期フォーカス */
export function FlowAlertDialog({
  open,
  titleId,
  title,
  children,
  cancelLabel = "キャンセル",
  confirmLabel,
  onCancel,
  onConfirm,
  cancelDisabled = false,
  confirmDisabled = false,
  confirmTestId,
  overlayDismiss = true,
}: FlowAlertDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement;
    const panel = panelRef.current;
    if (!panel) return;

    const focusables = getFocusables(panel);
    focusables[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!cancelDisabled) onCancel();
        return;
      }
      if (e.key !== "Tab") return;

      const currentFocusables = getFocusables(panel);
      if (currentFocusables.length === 0) return;

      const first = currentFocusables[0];
      const last = currentFocusables[currentFocusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onCancel, cancelDisabled]);

  if (!open) return null;

  return (
    <div
      className={fcDialogOverlay}
      role="presentation"
      onMouseDown={(e) => {
        if (overlayDismiss && e.target === e.currentTarget && !cancelDisabled) {
          onCancel();
        }
      }}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={fcDialogPanel}
      >
        <h2 id={titleId} className={fcDialogTitle}>
          {title}
        </h2>
        {children}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={cancelDisabled}
            onClick={onCancel}
            className={fcBtnCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={confirmDisabled}
            onClick={onConfirm}
            data-testid={confirmTestId}
            className={fcBtnDanger}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
