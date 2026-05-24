"use client";

import {
  createEmptyRow,
  COLUMN_HELP_8,
  getColumnCount,
  getHeaders,
  normalizeRow,
  SHAPE_TYPE_OPTIONS,
  suggestNextId,
  TABLE_HEADERS_8,
} from "@/lib/flowchart/tableColumns";
import type { FlowTableRow } from "@/lib/flowchart/types";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";

export type FlowTableEditorHandle = {
  scrollToRow: (rowIndex: number) => void;
};

type Props = {
  table: FlowTableRow[];
  onChange: (table: FlowTableRow[]) => void;
  errorRowIndices?: Set<number>;
};

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function parseCellValue(
  colIndex: number,
  colCount: number,
  raw: string,
): string | number {
  if (colCount >= 8 && colIndex === 0) {
    const trimmed = raw.trim();
    if (trimmed === "") return "";
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : trimmed;
  }
  if (colCount >= 8 && colIndex === 4) {
    const trimmed = raw.trim();
    if (trimmed === "") return 0;
    const n = Number(trimmed);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  }
  return raw;
}

function headerHelp(header: string, colCount: number): string | undefined {
  if (colCount >= 8 && header in COLUMN_HELP_8) {
    return COLUMN_HELP_8[header as (typeof TABLE_HEADERS_8)[number]];
  }
  return undefined;
}

export const FlowTableEditor = forwardRef<FlowTableEditorHandle, Props>(
  function FlowTableEditor({ table, onChange, errorRowIndices }, ref) {
    const colCount = getColumnCount(table);
    const headers = getHeaders(colCount);
    const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      scrollToRow: (rowIndex: number) => {
        rowRefs.current[rowIndex]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      },
    }));

    const updateTable = (next: FlowTableRow[]) => {
      onChange(next.map((row) => normalizeRow(row, colCount)));
    };

    const updateCell = (rowIndex: number, colIndex: number, raw: string) => {
      const next = table.map((row, ri) => {
        if (ri !== rowIndex) return normalizeRow(row, colCount);
        const cells = normalizeRow(row, colCount);
        cells[colIndex] = parseCellValue(colIndex, colCount, raw);
        return cells;
      });
      updateTable(next);
    };

    const addRow = () => {
      const id = suggestNextId(table);
      updateTable([...table, createEmptyRow(colCount, id)]);
    };

    const deleteRow = (rowIndex: number) => {
      if (table.length <= 1) return;
      updateTable(table.filter((_, i) => i !== rowIndex));
    };

    const isShapeColumn = (colIndex: number) =>
      colCount >= 8 ? colIndex === 1 : colIndex === 1 && colCount >= 2;

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <details className="rounded-md border border-slate-200 bg-slate-50/90 px-2 py-1 text-xs text-slate-600">
          <summary className="cursor-pointer font-medium text-slate-700">
            列の意味（ヘルプ）
          </summary>
          {colCount >= 8 ? (
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {TABLE_HEADERS_8.map((h) => (
                <li key={h}>
                  <strong>{h}</strong> — {COLUMN_HELP_8[h]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1">
              8 列形式を推奨します（判断の No 分岐には接続先(右)が必要です）。
            </p>
          )}
        </details>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addRow}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-50"
          >
            行を追加
          </button>
          <span className="text-xs text-slate-500">
            {table.length} 行 · {colCount} 列
          </span>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-auto rounded-md border border-slate-300"
        >
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100">
              <tr>
                <th className="w-10 border-b border-slate-200 px-1 py-1.5 text-center font-medium text-slate-600">
                  #
                </th>
                {headers.map((h) => {
                  const help = headerHelp(h, colCount);
                  return (
                    <th
                      key={h}
                      className="border-b border-slate-200 px-2 py-1.5 text-left font-medium text-slate-700"
                      title={help}
                    >
                      {h}
                      {help && (
                        <span className="ml-0.5 font-normal text-slate-400">
                          ?
                        </span>
                      )}
                    </th>
                  );
                })}
                <th className="w-14 border-b border-slate-200 px-1 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {table.map((row, rowIndex) => {
                const hasError = errorRowIndices?.has(rowIndex);
                return (
                  <tr
                    key={rowIndex}
                    ref={(el) => {
                      rowRefs.current[rowIndex] = el;
                    }}
                    data-row-index={rowIndex}
                    className={`odd:bg-white even:bg-slate-50/80 hover:bg-blue-50/40 ${
                      hasError ? "bg-red-100/90 ring-1 ring-inset ring-red-300" : ""
                    }`}
                  >
                    <td className="border-b border-slate-100 px-1 py-0.5 text-center text-slate-400">
                      {rowIndex + 1}
                    </td>
                    {headers.map((h, colIndex) => (
                      <td
                        key={colIndex}
                        className="border-b border-slate-100 px-0.5 py-0.5"
                      >
                        {isShapeColumn(colIndex) ? (
                          <select
                            value={cellToString(row[colIndex]) || "処理"}
                            onChange={(e) =>
                              updateCell(rowIndex, colIndex, e.target.value)
                            }
                            className="w-full rounded border-0 bg-transparent px-1.5 py-1 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                            aria-label={`行${rowIndex + 1} 図形種別`}
                          >
                            {SHAPE_TYPE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={cellToString(row[colIndex])}
                            onChange={(e) =>
                              updateCell(rowIndex, colIndex, e.target.value)
                            }
                            className="w-full rounded border-0 bg-transparent px-1.5 py-1 font-mono text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                            aria-label={`行${rowIndex + 1} ${h}`}
                          />
                        )}
                      </td>
                    ))}
                    <td className="border-b border-slate-100 px-1 py-0.5 text-center">
                      <button
                        type="button"
                        onClick={() => deleteRow(rowIndex)}
                        disabled={table.length <= 1}
                        className="rounded px-1 py-0.5 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                        title="行を削除"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
);
