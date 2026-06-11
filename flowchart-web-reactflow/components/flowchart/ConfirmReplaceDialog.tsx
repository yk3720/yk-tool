"use client";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
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
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
      >
        <h2
          id="confirm-replace-title"
          className="text-base font-semibold text-slate-900"
        >
          {title}
        </h2>
        <p id="confirm-replace-desc" className="mt-2 text-sm text-slate-600">
          {description}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
