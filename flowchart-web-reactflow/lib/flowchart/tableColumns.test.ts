import { describe, expect, it } from "vitest";
import {
  createEmptyRow,
  ensureNineColumnTable,
  getHeaders,
  getHelpEntries,
  inferTableLayout,
  isNumericTableColumn,
  normalizeRow,
  resolveColumnCount,
  suggestNextId,
  TABLE_HEADERS_9,
} from "./tableColumns";

describe("tableColumns", () => {
  it("getHeaders returns 9 columns with 段 and 列", () => {
    expect(getHeaders(9)).toEqual([...TABLE_HEADERS_9]);
    expect(getHeaders(9)[4]).toBe("段");
    expect(getHeaders(9)[5]).toBe("列");
    expect(getHeaders(9)[6]).toBe("Text1");
  });

  it("getHeaders keeps 8-column headers for legacy tables", () => {
    expect(getHeaders(8)).toHaveLength(8);
    expect(getHeaders(8)[4]).toBe("Level");
    expect(getHeaders(8)[5]).toBe("Text1");
  });

  it("getHelpEntries covers 9-column layout columns", () => {
    const headers = getHelpEntries(9).map((e) => e.header);
    expect(headers).toContain("段");
    expect(headers).toContain("列");
    expect(headers).toContain("Text1");
  });

  it("isNumericTableColumn treats 段 and 列 as numeric in 9-col", () => {
    expect(isNumericTableColumn(4, 9)).toBe(true);
    expect(isNumericTableColumn(5, 9)).toBe(true);
    expect(isNumericTableColumn(6, 9)).toBe(false);
  });

  it("inferTableLayout detects 8-wide tier9 rows (Text3 column missing)", () => {
    const table = [
      [1, "端子", "2", "", 1, 0, "開始", ""],
      [3, "処理", "6", "", 3, 0, "取付経路A", ""],
      [4, "処理", "6", "", 3, 1, "取付経路B", ""],
    ];
    expect(inferTableLayout(table)).toBe("tier9");
    expect(resolveColumnCount(table)).toBe(9);
    expect(getHeaders(resolveColumnCount(table))[4]).toBe("段");
    expect(getHeaders(resolveColumnCount(table))[6]).toBe("Text1");
  });

  it("ensureNineColumnTable pads to 9 without shifting cells", () => {
    const table = [[3, "処理", "6", "", 3, 0, "取付経路A", ""]];
    const next = ensureNineColumnTable(table);
    expect(next[0]).toHaveLength(9);
    expect(next[0][5]).toBe(0);
    expect(next[0][6]).toBe("取付経路A");
  });

  it("inferTableLayout keeps legacy 8-col sample-basic pattern", () => {
    const table = [[10, "端子", "20", "", 0, "開始", "", ""]];
    expect(inferTableLayout(table)).toBe("legacy8");
    expect(getHeaders(resolveColumnCount(table))[4]).toBe("Level");
  });

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

  it("createEmptyRow for 9 columns", () => {
    const row = createEmptyRow(9, 70);
    expect(row[0]).toBe(70);
    expect(row[1]).toBe("処理");
    expect(row[4]).toBe(0);
    expect(row[5]).toBe(0);
    expect(row).toHaveLength(9);
  });

  it("createEmptyRow for 8 columns", () => {
    const row = createEmptyRow(8, 70);
    expect(row[0]).toBe(70);
    expect(row[1]).toBe("処理");
    expect(row[4]).toBe(0);
    expect(row).toHaveLength(8);
  });
});
