"use client";

import {
  COLOR_HINT_LEGEND_ITEMS,
  FLOW_NODE_FRAME_STROKE,
} from "@/lib/flowchart/flowColors";
import { fcColorLegendFloating } from "./flowchartUiClasses";

/** プレビュー列に固定表示する色列凡例 */
export function FlowColorLegend() {
  return (
    <div className={fcColorLegendFloating} aria-label="色列の凡例">
      {COLOR_HINT_LEGEND_ITEMS.map(({ hint, label, title, fill }) => (
        <span
          key={hint}
          className="inline-flex items-center gap-1"
          title={title}
        >
          <span
            className="inline-block h-3 w-3 shrink-0 border-2"
            style={{
              backgroundColor: fill,
              borderColor: FLOW_NODE_FRAME_STROKE,
            }}
            aria-hidden
          />
          {label}
        </span>
      ))}
    </div>
  );
}
