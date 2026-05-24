export type ThemeId = "standard" | "safety" | "warning";

export type FlowTheme = {
  id: ThemeId;
  label: string;
  edgeStroke: string;
  edgeLabel: string;
  nodeBorder: string;
};

export const FLOW_THEMES: Record<ThemeId, FlowTheme> = {
  standard: {
    id: "standard",
    label: "標準（青）",
    edgeStroke: "#2563eb",
    edgeLabel: "#0f172a",
    nodeBorder: "#64748b",
  },
  safety: {
    id: "safety",
    label: "安全（緑）",
    edgeStroke: "#16a34a",
    edgeLabel: "#14532d",
    nodeBorder: "#15803d",
  },
  warning: {
    id: "warning",
    label: "注意（橙）",
    edgeStroke: "#d97706",
    edgeLabel: "#78350f",
    nodeBorder: "#b45309",
  },
};

export function resolveThemeId(id?: string): ThemeId {
  if (id && id in FLOW_THEMES) return id as ThemeId;
  return "standard";
}
