import { expect, test } from "@playwright/test";

import {
  ensureNavExpanded,
  ensureWorkspaceLoaded,
  loadSampleFromMenu,
} from "./helpers/flowchart";

test.describe("サンプルプレビューと上書き防止", () => {
  test("編集後: 例を見る → プレビュー終了で元の表が残る", async ({ page }) => {
    await ensureWorkspaceLoaded(page);
    await ensureNavExpanded(page);
    await page.getByRole("button", { name: "供給動作" }).click();
    const editCell = page.getByLabel("行2 Text1");
    await expect(editCell).toBeVisible({ timeout: 15_000 });
    await editCell.fill("自作フロー");
    await page.getByRole("button", { name: "再生成" }).click();
    await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 15_000 });

    await loadSampleFromMenu(page, "例を見る: カレーの作り方");
    await expect(page.getByText("レシピを確認")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/プレビュー（未保存）/)).toBeVisible();

    await page.getByTestId("cancel-sample-preview").click();
    await expect(page.getByText("自作フロー")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("レシピを確認")).toHaveCount(0);
  });

  test("編集後: 雛形適用は確認ダイアログでキャンセルできる", async ({
    page,
  }) => {
    await ensureWorkspaceLoaded(page);
    await ensureNavExpanded(page);
    await page.getByRole("button", { name: "供給動作" }).click();
    await page.getByLabel("行2 Text1").fill("残したい");
    await page.getByRole("button", { name: "再生成" }).click();
    await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 15_000 });

    await loadSampleFromMenu(page, "雛形を適用: 直線フロー");
    await expect(
      page.getByRole("alertdialog", { name: "表を雛形で始め直しますか？" })
    ).toBeVisible();
    await page.getByRole("button", { name: "キャンセル" }).click();

    await expect(page.getByText("残したい")).toBeVisible();
    await expect(page.getByText("ステップ1")).toHaveCount(0);
  });
});
