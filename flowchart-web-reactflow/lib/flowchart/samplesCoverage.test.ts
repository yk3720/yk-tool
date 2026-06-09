import { describe, expect, it } from "vitest";

import sampleAtm from "@/fixtures/sample-atm.json";
import sampleCurry from "@/fixtures/sample-curry.json";
import sampleMorning from "@/fixtures/sample-morning.json";
import { generateFlowchart } from "./generate";
import { COLOR_HINT_SELECT_OPTIONS } from "./flowColors";
import { SHAPE_TYPE_OPTIONS } from "./tableColumns";
import type { FlowchartDocument } from "./types";

const DEMO_SAMPLES = [
  sampleCurry,
  sampleMorning,
  sampleAtm,
] as FlowchartDocument[];

const COLOR_CELLS = [
  "",
  ...COLOR_HINT_SELECT_OPTIONS.map((o) => o.value).filter(Boolean),
];

function collectFromSample(doc: FlowchartDocument) {
  const shapes = new Set<string>();
  const colors = new Set<string>();
  for (const row of doc.table) {
    shapes.add(String(row[1] ?? "").trim());
    colors.add(String(row[9] ?? "").trim());
  }
  return { shapes, colors };
}

describe("demo samples coverage", () => {
  it("3 samples collectively use every shape type and color hint", () => {
    const shapes = new Set<string>();
    const colors = new Set<string>();
    for (const doc of DEMO_SAMPLES) {
      const collected = collectFromSample(doc);
      collected.shapes.forEach((s) => shapes.add(s));
      collected.colors.forEach((c) => colors.add(c));
    }
    for (const shape of SHAPE_TYPE_OPTIONS) {
      expect(shapes.has(shape), `missing shape: ${shape}`).toBe(true);
    }
    for (const color of COLOR_CELLS) {
      expect(
        colors.has(color),
        `missing color cell: ${color || "(通常)"}`
      ).toBe(true);
    }
  });

  it("each demo sample generates without errors", () => {
    for (const doc of DEMO_SAMPLES) {
      const result = generateFlowchart(doc.table, doc.layout);
      expect(result.ok, doc.title).toBe(true);
    }
  });
});
