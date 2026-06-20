import { describe, expect, it } from "vitest";
import {
  applyPartialPaste,
  parseClipboardGrid,
  parsePasteCellValue,
} from "./pasteTableCells";
import { normalizeRow } from "./tableColumns";
import type { FlowTableRow } from "./types";

const COL = 10;

function row(id: number, text1 = "", text2 = "", text3 = ""): FlowTableRow {
  return normalizeRow([id, "処理", "", "", 1, 0, text1, text2, text3, ""], COL);
}

describe("parseClipboardGrid", () => {
  it("parses tab-separated multi-cell range", () => {
    const grid = parseClipboardGrid("A\tB\nC\tD");
    expect(grid).toEqual([
      ["A", "B"],
      ["C", "D"],
    ]);
  });

  it("returns empty for blank clipboard", () => {
    expect(parseClipboardGrid("  \n  ")).toEqual([]);
  });
});

describe("applyPartialPaste", () => {
  it("overwrites from focused cell without replacing whole table", () => {
    const table = [row(10, "開始"), row(20, "処理A"), row(30, "終了")];
    const next = applyPartialPaste(
      table,
      1,
      6,
      [
        ["新A", "新B"],
        ["行3A", ""],
      ],
      COL
    );
    expect(next[0][6]).toBe("開始");
    expect(next[1][6]).toBe("新A");
    expect(next[1][7]).toBe("新B");
    expect(next[2][6]).toBe("行3A");
  });

  it("appends rows when paste extends beyond table", () => {
    const table = [row(10, "のみ")];
    const next = applyPartialPaste(table, 0, 6, [["A"], ["B"], ["C"]], COL);
    expect(next).toHaveLength(3);
    expect(next[2][6]).toBe("C");
    expect(next[2][0]).toBe(30);
  });

  it("parses numeric columns in pasted range", () => {
    const table = [row(10)];
    const next = applyPartialPaste(table, 0, 0, [["99", "判断"]], COL);
    expect(next[0][0]).toBe(99);
    expect(next[0][1]).toBe("判断");
    const tierCol = applyPartialPaste(table, 0, 4, [["3", "2"]], COL);
    expect(tierCol[0][4]).toBe(3);
    expect(tierCol[0][5]).toBe(2);
  });
});

describe("parsePasteCellValue", () => {
  it("matches table editor numeric rules", () => {
    expect(parsePasteCellValue(4, COL, "3")).toBe(3);
    expect(parsePasteCellValue(6, COL, "text")).toBe("text");
  });
});
