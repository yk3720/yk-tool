import { describe, expect, it } from "vitest";
import {
  FLOW_NODE_FILL_BY_HINT,
  normalizeColorHint,
  nodeBackgroundColor,
} from "./flowColors";

describe("flowColors", () => {
  it("normalizeColorHint maps Japanese cell values", () => {
    expect(normalizeColorHint("")).toEqual({ hint: "normal", unknown: false });
    expect(normalizeColorHint("  黄  ")).toEqual({
      hint: "yellow",
      unknown: false,
    });
    expect(normalizeColorHint("橙")).toEqual({
      hint: "orange",
      unknown: false,
    });
    expect(normalizeColorHint("青")).toEqual({ hint: "blue", unknown: false });
  });

  it("normalizeColorHint treats unknown values as normal with flag", () => {
    expect(normalizeColorHint("赤")).toEqual({
      hint: "normal",
      unknown: true,
    });
  });

  it("nodeBackgroundColor defaults to normal fill", () => {
    expect(nodeBackgroundColor()).toBe(FLOW_NODE_FILL_BY_HINT.normal);
    expect(nodeBackgroundColor("orange")).toBe("#ffedd5");
  });
});
