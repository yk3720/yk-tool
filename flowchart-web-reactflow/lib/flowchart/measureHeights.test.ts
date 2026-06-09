import { describe, expect, it } from "vitest";
import { measureTextAwareRowHeight, textLineCount } from "./measureHeights";
import type { FlowNode, LayoutConfig } from "./types";
import { DEFAULT_LAYOUT } from "./types";

function node(partial: Partial<FlowNode> & Pick<FlowNode, "id">): FlowNode {
  return {
    id: partial.id,
    type: partial.type ?? "処理",
    fullText: partial.fullText ?? "",
    destsDown: partial.destsDown ?? [],
    destsRight: partial.destsRight ?? [],
    level: partial.level ?? 0,
    rowIndex: partial.rowIndex ?? 0,
  };
}

describe("measureHeights", () => {
  it("counts Text1–3 lines from fullText", () => {
    expect(textLineCount(node({ id: "1", fullText: "A\nB\nC" }))).toBe(3);
    expect(textLineCount(node({ id: "1", fullText: "A" }))).toBe(1);
    expect(textLineCount(node({ id: "1", fullText: "" }))).toBe(1);
  });

  it("grows row height for multi-line nodes", () => {
    const config: LayoutConfig = { ...DEFAULT_LAYOUT, heightMin: 30 };
    const single = measureTextAwareRowHeight(
      [node({ id: "1", fullText: "一行" })],
      config
    );
    const multi = measureTextAwareRowHeight(
      [node({ id: "1", fullText: "1行目\n2行目\n3行目" })],
      config
    );
    expect(multi).toBeGreaterThan(single);
    expect(single).toBe(30);
    expect(multi).toBe(50);
  });
});
