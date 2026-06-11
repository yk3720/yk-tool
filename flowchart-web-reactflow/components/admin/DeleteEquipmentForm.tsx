"use client";

import { useState, useTransition } from "react";

import { deleteEquipmentByInternalCode } from "@/lib/admin/actions/deleteEquipment";

export function DeleteEquipmentForm() {
  const [internalCode, setInternalCode] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const trimmed = internalCode.trim();
  const canSubmit = trimmed.length > 0 && !isPending;

  function handleRequestDelete() {
    setMessage(null);
    if (!trimmed) return;
    setConfirmOpen(true);
  }

  function handleConfirmDelete() {
    setConfirmOpen(false);
    startTransition(async () => {
      const result = await deleteEquipmentByInternalCode(trimmed);
      if (result.ok) {
        setMessage({
          kind: "ok",
          text: `装置 ${result.internal_code} を削除しました`,
        });
        setInternalCode("");
      } else {
        setMessage({ kind: "error", text: result.error });
      }
    });
  }

  return (
    <div className="max-w-lg space-y-4">
      <p className="text-sm text-slate-600">
        誤登録した装置（社内番号単位）を削除します。紐づくユニット・モジュール・フロー表もすべて削除され、取り消せません。
      </p>

      <label className="block text-sm font-medium text-slate-800">
        社内番号（internal_code）
        <input
          type="text"
          value={internalCode}
          onChange={(e) => setInternalCode(e.target.value)}
          placeholder="例: DEMO-001"
          data-testid="admin-delete-internal-code"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          autoComplete="off"
        />
      </label>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleRequestDelete}
        data-testid="admin-delete-request"
        className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        削除を実行…
      </button>

      {message ? (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={
            message.kind === "error"
              ? "text-sm text-red-700"
              : "text-sm text-green-700"
          }
        >
          {message.text}
        </p>
      ) : null}

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmOpen(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-delete-title"
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2
              id="admin-delete-title"
              className="text-base font-semibold text-slate-900"
            >
              装置を削除しますか？
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              社内番号 <strong>{trimmed}</strong>{" "}
              とその配下をすべて削除します。この操作は元に戻せません。
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setConfirmOpen(false)}
                data-testid="admin-delete-cancel"
                className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmDelete}
                data-testid="admin-delete-confirm"
                className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
