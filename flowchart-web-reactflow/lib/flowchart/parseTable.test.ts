import { describe, expect, it } from "vitest";
import { parseTable } from "./parseTable";

describe("parseTable color column", () => {
  it("reads colorHint from column 10 when table has 10 columns", () => {
    const table = [
      [10, "処理", "", "", 1, 0, "A", "", "", "橙"],
      [20, "判断", "30", "40", 2, 0, "B", "", "", "黄"],
    ];
    const { nodes, colCount } = parseTable(table);
    expect(colCount).toBe(10);
    expect(nodes[0].colorHint).toBe("orange");
    expect(nodes[1].colorHint).toBe("yellow");
  });

  it("omits colorHint for 9-column tables", () => {
    const table = [[10, "処理", "", "", 1, 0, "A", "", ""]];
    const { nodes } = parseTable(table);
    expect(nodes[0].colorHint).toBeUndefined();
  });
});
