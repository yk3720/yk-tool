import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateFlowchart } from "./generate";
import { toMermaid } from "./toMermaid";
import type { FlowchartDocument } from "./types";

function loadFixture(name: string): FlowchartDocument {
  const raw = readFileSync(join(process.cwd(), "fixtures", name), "utf-8");
  return JSON.parse(raw) as FlowchartDocument;
}

describe("toMermaid", () => {
  it("emits flowchart TD with Yes/No labels for sample-basic", () => {
    const doc = loadFixture("sample-basic.json");
    const result = generateFlowchart(doc.table, doc.layout);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const mmd = toMermaid(result.placed, result.edges);
    expect(mmd).toMatch(/^flowchart TD/);
    expect(mmd).toContain('n10');
    expect(mmd).toContain('n30{');
    expect(mmd).toContain("-->|Yes|");
    expect(mmd).toContain("-->|No|");
  });
});
