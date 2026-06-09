import { describe, expect, it } from "vitest";
import { validateTableWarnings } from "./validationMeta";

describe("validateTableWarnings", () => {
  it("warns when ID column has no valid nodes", () => {
    const warnings = validateTableWarnings([
      ["", "処理", "", "", 0, "A", "", ""],
    ]);
    expect(warnings[0]).toContain("ID 列が空");
  });

  it("warns when decision has no branches", () => {
    const table = [[30, "判断", "", "", 0, "条件?", "", ""]];
    const warnings = validateTableWarnings(table);
    expect(
      warnings.some((w) => w.includes("ID 30") && w.includes("接続先(下)"))
    ).toBe(true);
  });

  it("warns when decision has multiple down targets", () => {
    const table = [[30, "判断", "40,50", "", 0, "条件?", "", ""]];
    const warnings = validateTableWarnings(table);
    expect(warnings.some((w) => w.includes("ID 30") && w.includes("1件"))).toBe(
      true
    );
  });
});
