"use client";

import { useRef, useState } from "react";
import { parseCsvPaste } from "@/lib/flowchart/parseCsv";
import { parseExcelBuffer } from "@/lib/flowchart/parseExcel";
import type { FlowTableRow } from "@/lib/flowchart/types";

type Props = {
  onApply: (table: FlowTableRow[]) => void;
};

export function CsvPastePanel({ onApply }: Props) {
  const [text, setText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyTable = (table: FlowTableRow[], detail: string) => {
    if (table.length === 0) {
      setMessage("表にできる行がありません");
      return;
    }
    onApply(table);
    setMessage(
      `${detail} — ${table.length} 行を表に反映しました。続けて「再生成」してください`
    );
    setText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePasteApply = () => {
    const { table, errors } = parseCsvPaste(text);
    if (errors.length > 0) {
      setMessage(errors.join(" / "));
      return;
    }
    applyTable(table, "貼り付け");
  };

  const handleExcelFile = async (file: File | undefined) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (ext !== "xlsx" && ext !== "xls") {
      setMessage(".xlsx または .xls を選んでください");
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      const { table, errors, sheetName } = parseExcelBuffer(buffer);
      if (errors.length > 0) {
        setMessage(errors.join(" / "));
        return;
      }
      applyTable(table, `Excel（シート: ${sheetName}）`);
    } catch {
      setMessage("Excel ファイルの読み込みに失敗しました");
    }
  };

  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50/80 p-2">
      <p className="mb-1 text-xs font-medium text-slate-700">
        CSV / Excel 取込
      </p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setMessage(null);
        }}
        placeholder="Excel やスプレッドシートから表をコピーして貼り付け（タブ区切り）"
        rows={3}
        className="w-full resize-y rounded border border-slate-300 p-2 font-mono text-xs"
        aria-label="CSV 貼り付け"
      />
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handlePasteApply}
          disabled={!text.trim()}
          className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-40"
        >
          貼り付けを反映
        </button>
        <label className="cursor-pointer rounded-md border border-slate-400 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-100">
          Excel ファイル…
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="sr-only"
            onChange={(e) => {
              setMessage(null);
              void handleExcelFile(e.target.files?.[0]);
            }}
          />
        </label>
        {message && (
          <span className="text-xs text-slate-600" role="status">
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
