import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseTable } from "./parseTable";
import { generateFlowchart } from "./generate";
import type { FlowchartDocument } from "./types";

function loadFixture(name: string): FlowchartDocument {
  const raw = readFileSync(join(process.cwd(), "fixtures", name), "utf-8");
  return JSON.parse(raw) as FlowchartDocument;
}

describe("parseTable", () => {
  it("parses sample-basic into 5 nodes", () => {
    const doc = loadFixture("sample-basic.json");
    const { nodes } = parseTable(doc.table);
    expect(nodes).toHaveLength(5);
    expect(nodes.map((n) => n.id)).toEqual(["10", "20", "30", "40", "50"]);
    const decision = nodes.find((n) => n.id === "30");
    expect(decision?.destsDown).toEqual(["40"]);
    expect(decision?.destsRight).toEqual(["50"]);
  });

  it("joins Text1–Text3 into fullText with newlines", () => {
    const table = [[10, "処理", "20", "", 0, "主", "副", "補足"]];
    const { nodes } = parseTable(table);
    expect(nodes[0]?.fullText).toBe("主\n副\n補足");
  });

  it("parses sample-m002-9col with tier and column (ADR-012)", () => {
    const doc = loadFixture("sample-m002-9col.json");
    const { nodes } = parseTable(doc.table);
    expect(nodes).toHaveLength(14);
    const parallel = nodes.filter((n) => ["3", "4", "5"].includes(n.id));
    expect(parallel.map((n) => n.tier)).toEqual([3, 3, 3]);
    expect(parallel.map((n) => n.level)).toEqual([0, 1, 2]);
    const merge = nodes.find((n) => n.id === "6");
    expect(merge?.destsDown).toEqual(["7"]);
  });
});

describe("generateFlowchart (golden: sample-basic)", () => {
  it("produces placed nodes and edges for basic decision flow", () => {
    const doc = loadFixture("sample-basic.json");
    const result = generateFlowchart(doc.table, doc.layout);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.nodes).toHaveLength(5);
    expect(result.placed).toHaveLength(5);
    expect(result.edges.length).toBeGreaterThanOrEqual(4);

    const n10 = result.placed.find((p) => p.id === "10");
    const n30 = result.placed.find((p) => p.id === "30");
    const n50 = result.placed.find((p) => p.id === "50");
    expect(n10).toMatchObject({ x: 40, y: 40, shapeKind: "rounded" });
    expect(n30?.shapeKind).toBe("diamond");
    expect(n50?.level).toBe(1);
    expect(n50!.x).toBeGreaterThan(n30!.x);

    const yesEdge = result.edges.find(
      (e) => e.sourceId === "30" && e.direction === "down"
    );
    const noEdge = result.edges.find(
      (e) => e.sourceId === "30" && e.direction === "right"
    );
    expect(yesEdge?.label).toBe("Yes");
    expect(noEdge?.label).toBe("No");

    expect(result.bounds.right).toBeGreaterThan(result.bounds.left);
    expect(result.bounds.bottom).toBeGreaterThan(result.bounds.top);
  });

  it("tallens nodes when Text1–Text3 span multiple lines", () => {
    const doc = loadFixture("sample-simple-yes.json");
    const layout = { ...doc.layout, heightMin: 30 };
    const result = generateFlowchart(doc.table, layout);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const n50 = result.placed.find((p) => p.id === "50");
    const n20 = result.placed.find((p) => p.id === "20");
    expect(n50?.fullText).toBe("数分追加で煮込む\n再試行");
    expect(n50?.height).toBeGreaterThan(n20?.height ?? 0);
    expect(n50?.height).toBe(36);
  });

  it("stops on missing connection target", () => {
    const doc = loadFixture("sample-basic.json");
    const bad = doc.table.map((row) =>
      row[0] === 20 ? [20, "処理", "99", "", 0, "処理A", "", ""] : row
    );
    const result = generateFlowchart(bad, doc.layout);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.includes("99"))).toBe(true);
  });
});

describe("generateFlowchart (ADR-012 tier-based layout)", () => {
  it("places tier=3 parallel nodes at the same y", () => {
    const doc = loadFixture("sample-m002-9col.json");
    const result = generateFlowchart(doc.table, doc.layout);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const n3 = result.placed.find((p) => p.id === "3");
    const n4 = result.placed.find((p) => p.id === "4");
    const n5 = result.placed.find((p) => p.id === "5");
    expect(n3 && n4 && n5).toBeTruthy();
    if (!n3 || !n4 || !n5) return;

    expect(n3.y).toBe(n4.y);
    expect(n4.y).toBe(n5.y);
    expect(n3.x).toBeLessThan(n4.x);
    expect(n4.x).toBeLessThan(n5.x);
  });

  it("routes merge edges (3/4/5 -> 6) via bus-like elbow", () => {
    const doc = loadFixture("sample-m002-9col.json");
    const result = generateFlowchart(doc.table, doc.layout);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const into6 = result.edges.filter(
      (e) =>
        e.direction === "down" &&
        e.targetId === "6" &&
        ["3", "4", "5"].includes(e.sourceId)
    );
    // Regression guard for ADR-012 / M002 fixture.
    expect(into6).toHaveLength(3);
    expect(into6.every((e) => e.route === "elbow")).toBe(true);
  });
});

describe("generateFlowchart (curry sample loops)", () => {
  it("No on 接続先(右) uses side column then returns to earlier step", () => {
    const doc = loadFixture("sample-curry.json");
    const result = generateFlowchart(doc.table, doc.layout);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const onionSide = result.edges.find(
      (e) =>
        e.sourceId === "50" && e.targetId === "55" && e.direction === "right"
    );
    const onionLoop = result.edges.find(
      (e) =>
        e.sourceId === "55" && e.targetId === "40" && e.direction === "down"
    );
    const boilSide = result.edges.find(
      (e) =>
        e.sourceId === "80" && e.targetId === "85" && e.direction === "right"
    );
    const boilLoop = result.edges.find(
      (e) =>
        e.sourceId === "85" && e.targetId === "70" && e.direction === "down"
    );
    expect(onionSide?.label).toBe("No");
    expect(onionLoop?.label).toBeUndefined();
    expect(boilSide?.label).toBe("No");
    expect(boilLoop?.label).toBeUndefined();

    const retryOnion = result.placed.find((p) => p.id === "55");
    const sauté = result.placed.find((p) => p.id === "40");
    expect(retryOnion && sauté).toBeTruthy();
    if (!retryOnion || !sauté) return;
    expect(retryOnion?.level).toBe(1);
    expect(sauté && retryOnion && retryOnion.x).toBeGreaterThan(sauté.x);
  });

  it("forwardDown cross-column uses bottom→top (55→70)", () => {
    const doc = loadFixture("sample-curry.json");
    const table = doc.table.map((row) => [...row]);
    const row55 = table.find((row) => String(row[0]) === "55");
    expect(row55).toBeTruthy();
    if (row55) row55[2] = "70";

    const result = generateFlowchart(table, doc.layout);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const edge = result.edges.find(
      (e) =>
        e.sourceId === "55" && e.targetId === "70" && e.direction === "down"
    );
    expect(edge?.sourceSide).toBe("bottom");
    expect(edge?.targetSide).toBe("top");
    expect(edge?.route).toBe("elbow");
  });
});
