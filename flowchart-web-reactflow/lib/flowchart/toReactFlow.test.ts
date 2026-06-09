import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateFlowchart } from "./generate";
import { toReactFlow } from "./toReactFlow";
import type { FlowchartDocument } from "./types";

function loadFixture(name: string): FlowchartDocument {
  const raw = readFileSync(join(process.cwd(), "fixtures", name), "utf-8");
  return JSON.parse(raw) as FlowchartDocument;
}

describe("toReactFlow", () => {
  it("maps placed nodes and labeled edges for sample-basic", () => {
    const doc = loadFixture("sample-basic.json");
    const result = generateFlowchart(doc.table, doc.layout);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { nodes, edges } = toReactFlow(result.placed, result.edges);
    expect(nodes).toHaveLength(5);
    expect(nodes.every((n) => n.type === "flowShape")).toBe(true);
    expect(nodes.find((n) => n.id === "30")?.data.shapeKind).toBe("diamond");

    const labels = edges
      .map((e) => (e.data as { edgeLabel?: string })?.edgeLabel)
      .filter(Boolean);
    expect(labels).toContain("Yes");
    expect(labels).toContain("No");
    const yesEdge = edges.find(
      (e) => (e.data as { branch?: string })?.branch === "yes"
    );
    expect(yesEdge?.data).toMatchObject({ direction: "down", branch: "yes" });
    expect(
      edges.some((e) => e.source === "30" && e.sourceHandle === "bottom")
    ).toBe(true);
  });
});
