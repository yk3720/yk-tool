"use client";

import {
  fcBtnCancel,
  fcBtnDanger,
  fcDialogBody,
  fcDialogOverlay,
  fcDialogPanel,
  fcDialogTitle,
} from "./flowchartUiClasses";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** 破壊的な表置換の確認（alertdialog · Cancel に初期フォーカス） */
export function ConfirmReplaceDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className={fcDialogOverlay}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-replace-title"
        aria-describedby="confirm-replace-desc"
        className={fcDialogPanel}
      >
        <h2 id="confirm-replace-title" className={fcDialogTitle}>
          {title}
        </h2>
        <p id="confirm-replace-desc" className={fcDialogBody}>
          {description}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className={fcBtnCancel}
          >
            キャンセル
          </button>
          <button type="button" onClick={onConfirm} className={fcBtnDanger}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
