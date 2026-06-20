import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { headerRegenerate, openPreviewWithSample } from "./helpers/flowchart";

const A0001_SCRATCH_XLSX = path.join(
  process.cwd(),
  "tools/excel_normalize/fixtures/devices/A0001_塗布装置/_scratch/取出.xlsx"
);

function excelFileInput(page: import("@playwright/test").Page) {
  return page
    .locator("label")
    .filter({ hasText: "Excel ファイル…" })
    .locator('input[type="file"]');
}

test.describe("A0001 1 動作 Excel Web 取込", () => {
  test("_scratch/取出.xlsx → 表反映 → 再生成で 3 ノード", async ({ page }) => {
    test.skip(
      !fs.existsSync(A0001_SCRATCH_XLSX),
      "npm run excel:a0001:scratch で xlsx を生成してください"
    );

    await openPreviewWithSample(page);

    const buffer = fs.readFileSync(A0001_SCRATCH_XLSX);
    await excelFileInput(page).setInputFiles({
      name: "取出.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer,
    });

    await expect(page.getByText(/3 行を表に反映/)).toBeVisible();
    await expect(page.getByText("プレビューはまだ古い")).toBeVisible();

    await page
      .getByRole("status")
      .filter({ hasText: "プレビューはまだ古い" })
      .getByRole("button", { name: "再生成" })
      .click();

    await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".react-flow__node")).toHaveCount(3, {
      timeout: 15_000,
    });
    await expect(page.getByText("ワーク取出")).toBeVisible();
  });

  test("取込後にヘッダ再生成でも同じ 3 ノード", async ({ page }) => {
    test.skip(
      !fs.existsSync(A0001_SCRATCH_XLSX),
      "npm run excel:a0001:scratch で xlsx を生成してください"
    );

    await openPreviewWithSample(page);

    const buffer = fs.readFileSync(A0001_SCRATCH_XLSX);
    await excelFileInput(page).setInputFiles({
      name: "取出.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer,
    });
    await expect(page.getByText(/3 行を表に反映/)).toBeVisible();

    await headerRegenerate(page).click();
    await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".react-flow__node")).toHaveCount(3, {
      timeout: 15_000,
    });
  });
});
