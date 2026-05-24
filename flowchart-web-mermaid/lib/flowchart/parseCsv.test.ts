import { describe, expect, it } from "vitest";
import { parseCsvPaste } from "./parseCsv";

describe("parseCsvPaste", () => {
  it("parses tab-separated rows", () => {
    const tsv = [
      "10\t端子\t20\t\t0\t開始\t\t",
      "20\t処理\t30\t\t0\t処理A\t\t",
    ].join("\n");
    const { table, errors } = parseCsvPaste(tsv);
    expect(errors).toHaveLength(0);
    expect(table).toHaveLength(2);
    expect(table[0][0]).toBe(10);
    expect(table[0][1]).toBe("端子");
  });

  it("skips header row when first cell is ID", () => {
    const tsv = [
      "ID\t図形種別\t接続先(下)\t接続先(右)\tLevel\tText1",
      "10\t端子\t20\t\t0\t開始",
    ].join("\n");
    const { table } = parseCsvPaste(tsv);
    expect(table).toHaveLength(1);
    expect(table[0][0]).toBe(10);
  });
});
