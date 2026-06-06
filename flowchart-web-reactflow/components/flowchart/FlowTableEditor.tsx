"use client";

import {
  createEmptyRow,
  getColumnHelp,
  getHeaders,
  getHelpEntries,
  isColorTableColumn,
  isNumericTableColumn,
  normalizeRow,
  resolveColumnCount,
  SHAPE_TYPE_OPTIONS,
  suggestNextId,
} from "@/lib/flowchart/tableColumns";
import { COLOR_HINT_SELECT_OPTIONS } from "@/lib/flowchart/flowColors";
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
  readOnly?: boolean;
  /** table-9col-v1 等 — 9列ヘッダー判定に使用 */
  tableSchema?: string;
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
  if (!isNumericTableColumn(colIndex, colCount)) return raw;
  if (colIndex === 0) {
    const trimmed = raw.trim();
    if (trimmed === "") return "";
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : trimmed;
  }
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

export const FlowTableEditor = forwardRef<FlowTableEditorHandle, Props>(
  function FlowTableEditor({ table, onChange, errorRowIndices, readOnly, tableSchema }, ref) {
    const colCount = resolveColumnCount(table, tableSchema);
    const headers = getHeaders(colCount, tableSchema);
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

    const isSelectColumn = (colIndex: number) =>
      isShapeColumn(colIndex) || isColorTableColumn(colIndex, colCount);

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <details className="rounded-md border border-slate-200 bg-slate-50/90 px-2 py-1 text-xs text-slate-600">
          <summary className="cursor-pointer font-medium text-slate-700">
            列の意味（ヘルプ）
          </summary>
          {colCount >= 8 ? (
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {getHelpEntries(colCount, tableSchema).map(({ header, help }) => (
                <li key={header}>
                  <strong>{header}</strong> — {help}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1">
              9 列形式（段・列）を推奨します。判断の No 分岐には接続先(右)が必要です。
            </p>
          )}
        </details>

        <div className="flex flex-wrap items-center gap-2">
          {!readOnly ? (
            <button
              type="button"
              onClick={addRow}
              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-50"
            >
              行を追加
            </button>
          ) : null}
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
                  const help = getColumnHelp(h, colCount);
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
                        {isSelectColumn(colIndex) ? (
                          <select
                            value={
                              isColorTableColumn(colIndex, colCount)
                                ? cellToString(row[colIndex])
                                : cellToString(row[colIndex]) || "処理"
                            }
                            onChange={(e) =>
                              updateCell(rowIndex, colIndex, e.target.value)
                            }
                            disabled={readOnly}
                            className="w-full rounded border-0 bg-transparent px-1.5 py-1 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 disabled:cursor-default disabled:opacity-90"
                            aria-label={`行${rowIndex + 1} ${h}`}
                          >
                            {(isColorTableColumn(colIndex, colCount)
                              ? COLOR_HINT_SELECT_OPTIONS
                              : SHAPE_TYPE_OPTIONS.map((opt) => ({
                                  value: opt,
                                  label: opt,
                                }))
                            ).map((opt) => (
                              <option key={opt.value || "__empty"} value={opt.value}>
                                {opt.label}
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
                            readOnly={readOnly}
                            className="w-full rounded border-0 bg-transparent px-1.5 py-1 font-mono text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 read-only:cursor-default read-only:opacity-90"
                            aria-label={`行${rowIndex + 1} ${h}`}
                          />
                        )}
                      </td>
                    ))}
                    <td className="border-b border-slate-100 px-1 py-0.5 text-center">
                      {!readOnly ? (
                        <button
                          type="button"
                          onClick={() => deleteRow(rowIndex)}
                          disabled={table.length <= 1}
                          className="rounded px-1 py-0.5 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                          title="行を削除"
                        >
                          削除
                        </button>
                      ) : null}
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
