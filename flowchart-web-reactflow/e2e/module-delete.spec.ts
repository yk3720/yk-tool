import { expect, test } from "@playwright/test";

import {
  ensureNavExpanded,
  ensureWorkspaceLoaded,
  MODULE_SUPPLY_FEED_A_ID,
} from "./helpers/flowchart";

test.describe("モジュール削除", () => {
  test.beforeEach(async ({ page }) => {
    await ensureWorkspaceLoaded(page);
    await ensureNavExpanded(page);
  });

  test("ゴミ箱 → 確認 → 削除成功バナーとナビから消える", async ({ page }) => {
    const deleteButton = page.getByTestId(
      `delete-module-${MODULE_SUPPLY_FEED_A_ID}`
    );
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();
    await expect(
      page.getByRole("heading", { name: "動作を削除しますか？" })
    ).toBeVisible();
    await page.getByTestId("delete-module-confirm").click();

    await expect(page.getByText("動作を削除しました")).toBeVisible({
      timeout: 15_000,
    });
    await expect(deleteButton).toHaveCount(0);
  });
});
