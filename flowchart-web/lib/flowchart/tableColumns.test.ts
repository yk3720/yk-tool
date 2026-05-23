import { describe, expect, it } from "vitest";
import {
  createEmptyRow,
  normalizeRow,
  suggestNextId,
} from "./tableColumns";

describe("tableColumns", () => {
  it("suggestNextId returns max+10", () => {
    expect(
      suggestNextId([
        [10, "端子"],
        [50, "処理"],
      ]),
    ).toBe(60);
  });

  it("normalizeRow pads and trims", () => {
    expect(normalizeRow([10, "処理"], 4)).toEqual([10, "処理", "", ""]);
    expect(normalizeRow([10, "処理", "a", "b", "c"], 3)).toEqual([
      10,
      "処理",
      "a",
    ]);
  });

  it("createEmptyRow for 8 columns", () => {
    const row = createEmptyRow(8, 70);
    expect(row[0]).toBe(70);
    expect(row[1]).toBe("処理");
    expect(row[4]).toBe(0);
    expect(row).toHaveLength(8);
  });
});
