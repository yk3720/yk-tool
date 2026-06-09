"use client";

import { COLOR_HINT_LEGEND_ITEMS } from "@/lib/flowchart/flowColors";

/** プレビュー列に固定表示する色列凡例 */
export function FlowColorLegend() {
  return (
    <div
      className="pointer-events-none absolute bottom-2 left-2 z-10 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-slate-200 bg-white/95 px-2.5 py-1.5 text-[10px] text-slate-700 shadow-sm"
      aria-label="色列の凡例"
    >
      {COLOR_HINT_LEGEND_ITEMS.map(({ hint, label, title, fill }) => (
        <span
          key={hint}
          className="inline-flex items-center gap-1"
          title={title}
        >
          <span
            className="inline-block h-3 w-3 shrink-0 border border-[#1a1a1a]"
            style={{ backgroundColor: fill }}
            aria-hidden
          />
          {label}
        </span>
      ))}
    </div>
  );
}
