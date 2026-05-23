"use client";

import { useState } from "react";
import { parseCsvPaste } from "@/lib/flowchart/parseCsv";
import type { FlowTableRow } from "@/lib/flowchart/types";

type Props = {
  onApply: (table: FlowTableRow[]) => void;
};

export function CsvPastePanel({ onApply }: Props) {
  const [text, setText] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleApply = () => {
    const { table, errors } = parseCsvPaste(text);
    if (errors.length > 0) {
      setMessage(errors.join(" / "));
      return;
    }
    if (table.length === 0) {
      setMessage("表にできる行がありません");
      return;
    }
    onApply(table);
    setMessage(`${table.length} 行を表に反映しました。続けて「再生成」してください`);
    setText("");
  };

  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50/80 p-2">
      <p className="mb-1 text-xs font-medium text-slate-700">
        CSV / Excel 貼り付け
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
          onClick={handleApply}
          disabled={!text.trim()}
          className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-40"
        >
          表に反映
        </button>
        {message && (
          <span className="text-xs text-slate-600" role="status">
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
