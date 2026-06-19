import { expect, test } from "@playwright/test";

import {
  DEVICE_PRESS_B_ID,
  ensureNavExpanded,
  ensureWorkspaceLoaded,
  loadSampleFromMenu,
} from "./helpers/flowchart";

test.describe("モジュール読込 UX", () => {
  test("装置切替後は「読み込み中」バナーが残らない", async ({ page }) => {
    await ensureWorkspaceLoaded(page);
    await ensureNavExpanded(page);
    await page.getByRole("button", { name: "供給動作" }).click();
    await expect(page.getByLabel("行1 Text1")).toBeVisible({ timeout: 15_000 });

    await page
      .getByRole("combobox", { name: "装置を選択" })
      .selectOption(DEVICE_PRESS_B_ID);

    await expect(page.getByText("モジュールを読み込み中")).toHaveCount(0, {
      timeout: 5_000,
    });
    await expect(page.getByText("モジュールを選択してください")).toHaveCount(2);
  });

  test("モジュール選択後は雛形プレースホルダが残らない", async ({ page }) => {
    await ensureWorkspaceLoaded(page);
    await ensureNavExpanded(page);
    await page.getByRole("button", { name: "供給動作" }).click();
    await expect(page.getByLabel("行1 Text1")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("ここに処理名")).toHaveCount(0);
    await expect(page.getByTestId("module-loading-overlay")).toHaveCount(0);
  });

  test("サンプル読込後に別モジュールへ切替するとカレー表が残らない", async ({
    page,
  }) => {
    await ensureWorkspaceLoaded(page);
    await ensureNavExpanded(page);
    await page.getByRole("button", { name: "供給動作" }).click();
    await expect(page.getByLabel("行2 Text1")).toBeVisible({ timeout: 15_000 });

    await loadSampleFromMenu(page, "例を見る: カレーの作り方");
    await expect(page.getByText("レシピを確認")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "検知動作" }).click();
    await expect(page.getByText("レシピを確認")).toHaveCount(0, {
      timeout: 15_000,
    });
    await expect(page.getByLabel("行1 Text1")).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("サンプルプレビュー（モジュール未選択）", () => {
  test("例を見たあとプレビューを終了できる", async ({ page }) => {
    await ensureWorkspaceLoaded(page);
    await loadSampleFromMenu(page, "例を見る: カレーの作り方");
    await expect(page.getByText("レシピを確認")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByTestId("cancel-sample-preview").click();
    await expect(page.getByText("レシピを確認")).toHaveCount(0);
    await expect(page.getByText("モジュールを選択してください")).toHaveCount(2);
  });
});
