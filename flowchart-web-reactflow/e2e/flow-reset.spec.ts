import { expect, test } from "@playwright/test";

import {
  ensureNavExpanded,
  ensureWorkspaceLoaded,
  loadSampleFromMenu,
  openMoreMenu,
} from "./helpers/flowchart";

test.describe("フロー中身リセット", () => {
  test.beforeEach(async ({ page }) => {
    await ensureWorkspaceLoaded(page);
  });

  test("モジュール選択 → リセット確認 → 成功バナーと雛形表", async ({
    page,
  }) => {
    await ensureNavExpanded(page);
    await page.getByRole("button", { name: "供給動作" }).click();
    await loadSampleFromMenu(page, "例を見る: カレーの作り方");
    await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("レシピを確認")).toBeVisible();

    await openMoreMenu(page);
    await page
      .getByRole("menuitem", { name: "フローを雛形にリセット…" })
      .click();
    await expect(
      page.getByRole("heading", { name: "フローを雛形にリセットしますか？" })
    ).toBeVisible();
    await page.getByTestId("reset-flow-confirm").click();

    await expect(page.getByText("フローを雛形にリセットしました")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("ここに処理名")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("レシピを確認")).toHaveCount(0);
  });
});
