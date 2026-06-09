import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { parseExcelBuffer, pickFlowchartSheetName } from "./parseExcel";

function buildWorkbookBuffer(
  sheets: Record<string, (string | number)[][]>
): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  for (const [name, data] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), name);
  }
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

describe("parseExcelBuffer", () => {
  it("reads 8-column table from preferred sheet name", () => {
    const buffer = buildWorkbookBuffer({
      図形: [["ignored"]],
      表: [
        [
          "ID",
          "図形種別",
          "接続先(下)",
          "接続先(右)",
          "Level",
          "Text1",
          "Text2",
          "Text3",
        ],
        [10, "端子", 20, "", 0, "開始", "", ""],
        [20, "処理", 30, "", 0, "処理A", "", ""],
      ],
    });
    const { table, errors, sheetName } = parseExcelBuffer(buffer);
    expect(errors).toHaveLength(0);
    expect(sheetName).toBe("表");
    expect(table).toHaveLength(2);
    expect(table[0][0]).toBe(10);
    expect(table[0][1]).toBe("端子");
  });

  it("picks sheet with most data rows when name is generic", () => {
    const buffer = buildWorkbookBuffer({
      Sheet1: [["a"]],
      Sheet2: [
        ["10", "端子", "20", "", "0", "開始", "", ""],
        ["20", "処理", "30", "", "0", "処理A", "", ""],
      ],
    });
    expect(pickFlowchartSheetName(XLSX.read(buffer, { type: "array" }))).toBe(
      "Sheet2"
    );
  });
});
