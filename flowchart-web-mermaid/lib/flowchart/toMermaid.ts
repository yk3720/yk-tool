import type { FlowEdge, PlacedNode, ShapeKind } from "./types";

/** Mermaid ノード ID（表 ID を安全化） */
export function mermaidNodeId(id: string): string {
  return `n${id.replace(/\W/g, "_")}`;
}

function escapeLabel(text: string): string {
  return text
    .replace(/"/g, "#quot;")
    .replace(/\[/g, "#91;")
    .replace(/\]/g, "#93;")
    .replace(/[{}]/g, (c) => (c === "{" ? "#123;" : "#125;"))
    .replace(/\n/g, "<br/>");
}

function nodeLine(id: string, shapeKind: ShapeKind, label: string): string {
  const mid = mermaidNodeId(id);
  const text = escapeLabel(label);
  switch (shapeKind) {
    case "diamond":
      return `  ${mid}{"${text}"}`;
    case "rounded":
      return `  ${mid}(["${text}"])`;
    case "parallelogram":
      return `  ${mid}[/"${text}"/]`;
    case "manual":
      return `  ${mid}[("${text}")]`;
    default:
      return `  ${mid}["${text}"]`;
  }
}

export function toMermaid(placed: PlacedNode[], edges: FlowEdge[]): string {
  const lines: string[] = ["flowchart TD"];
  const seen = new Set<string>();

  for (const p of placed) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    const label = p.fullText?.trim() || p.type;
    lines.push(nodeLine(p.id, p.shapeKind, label));
  }

  for (const e of edges) {
    const from = mermaidNodeId(e.sourceId);
    const to = mermaidNodeId(e.targetId);
    const label = e.label ? `|${e.label}|` : "";
    lines.push(`  ${from} -->${label} ${to}`);
  }

  return lines.join("\n");
}
