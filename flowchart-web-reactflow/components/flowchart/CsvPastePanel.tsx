"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { parseCsvPaste } from "@/lib/flowchart/parseCsv";
import { parseExcelBuffer } from "@/lib/flowchart/parseExcel";
import type { FlowTableRow } from "@/lib/flowchart/types";
import {
  fcBtnCompactPrimary,
  fcBtnCompactSecondary,
  fcBtnCompactWarning,
  fcPastePanel,
  fcPastePanelTitle,
  fcPasteTextarea,
  fcStatusText,
  fcWarningCallout,
} from "./flowchartUiClasses";

type Props = {
  onApply: (table: FlowTableRow[]) => void;
  onRegenerate?: () => void;
};

export function CsvPastePanel({ onApply, onRegenerate }: Props) {
  const [text, setText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [showRegenerateCallout, setShowRegenerateCallout] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyTable = (table: FlowTableRow[], detail: string) => {
    if (table.length === 0) {
      setMessage("表にできる行がありません");
      setShowRegenerateCallout(false);
      return;
    }
    onApply(table);
    setMessage(`${detail} — ${table.length} 行を表に反映しました`);
    setShowRegenerateCallout(true);
    setText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePasteApply = () => {
    const { table, errors } = parseCsvPaste(text);
    if (errors.length > 0) {
      setMessage(errors.join(" / "));
      setShowRegenerateCallout(false);
      return;
    }
    applyTable(table, "貼り付け");
  };

  const handleExcelFile = async (file: File | undefined) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (ext !== "xlsx" && ext !== "xls") {
      setMessage(".xlsx または .xls を選んでください");
      setShowRegenerateCallout(false);
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      const { table, errors, sheetName } = parseExcelBuffer(buffer);
      if (errors.length > 0) {
        setMessage(errors.join(" / "));
        setShowRegenerateCallout(false);
        return;
      }
      applyTable(table, `Excel（シート: ${sheetName}）`);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Excel ファイルの読み込みに失敗しました"
      );
      setShowRegenerateCallout(false);
    }
  };

  return (
    <div className={fcPastePanel}>
      <p className={fcPastePanelTitle}>CSV / Excel 取込</p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setMessage(null);
          setShowRegenerateCallout(false);
        }}
        placeholder="Excel やスプレッドシートから表をコピーして貼り付け（タブ区切り）"
        rows={3}
        className={fcPasteTextarea}
        aria-label="CSV 貼り付け"
      />
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handlePasteApply}
          disabled={!text.trim()}
          className={fcBtnCompactPrimary}
        >
          貼り付けを反映
        </button>
        <label className={fcBtnCompactSecondary}>
          Excel ファイル…
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="sr-only"
            onChange={(e) => {
              setMessage(null);
              setShowRegenerateCallout(false);
              void handleExcelFile(e.target.files?.[0]);
            }}
          />
        </label>
        {message ? (
          <span className={cn("text-xs", fcStatusText)} role="status">
            {message}
          </span>
        ) : null}
      </div>
      {showRegenerateCallout && onRegenerate ? (
        <div
          className={cn(
            "mt-2 flex flex-wrap items-center gap-2",
            fcWarningCallout
          )}
          role="status"
        >
          <span>プレビューはまだ古いままです。</span>
          <button
            type="button"
            onClick={() => {
              onRegenerate();
              setShowRegenerateCallout(false);
            }}
            className={fcBtnCompactWarning}
          >
            再生成
          </button>
        </div>
      ) : null}
    </div>
  );
}
