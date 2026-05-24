import type { LayoutConfig } from "./types";
import { DEFAULT_LAYOUT } from "./types";

export type LayoutPresetId = "small" | "medium" | "large";

export const LAYOUT_PRESETS: Record<
  LayoutPresetId,
  { label: string; layout: LayoutConfig }
> = {
  small: {
    label: "小",
    layout: {
      width: 120,
      heightMin: 48,
      gapV: 24,
      gapH: 72,
      baseLeft: 32,
      baseTop: 32,
    },
  },
  medium: {
    label: "中（標準）",
    layout: { ...DEFAULT_LAYOUT },
  },
  large: {
    label: "大",
    layout: {
      width: 200,
      heightMin: 72,
      gapV: 40,
      gapH: 120,
      baseLeft: 48,
      baseTop: 48,
    },
  },
};

export function layoutPresetFromConfig(
  layout: LayoutConfig,
): LayoutPresetId {
  if (layout.width === LAYOUT_PRESETS.small.layout.width) return "small";
  if (layout.width === LAYOUT_PRESETS.large.layout.width) return "large";
  return "medium";
}
