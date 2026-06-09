import { expect, type Page } from "@playwright/test";

export const EMPTY_MODULE_MSG = "モジュールを選択してください";

export const DEVICE_PRESS_A_ID = "a0000001-0001-4001-8001-000000000001";
export const DEVICE_PRESS_B_ID = "a0000001-0001-4001-8001-000000000002";

export function headerRegenerate(page: Page) {
  return page.locator("header").getByRole("button", { name: "再生成" });
}

export async function openMoreMenu(page: Page) {
  await page.getByRole("button", { name: "その他" }).click();
}

export async function loadSampleFromMenu(page: Page, label: string) {
  await openMoreMenu(page);
  await page.getByRole("menuitem", { name: label }).click();
}

/** ワークスペース（認証済み）であること */
export async function ensureWorkspaceLoaded(page: Page) {
  await page.goto("/");
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "フロー" })).toBeVisible({
    timeout: 15_000,
  });
}

export async function ensureNavExpanded(page: Page) {
  const openNav = page.getByRole("button", { name: "ナビを開く" });
  if (await openNav.isVisible()) {
    await openNav.click();
  }
}

/** サンプル読込で表・プレビューを表示（モジュール未選択でも可） */
export async function openPreviewWithSample(
  page: Page,
  label = "サンプル: カレーの作り方"
) {
  await ensureWorkspaceLoaded(page);
  await loadSampleFromMenu(page, label);
  await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".react-flow__node")).not.toHaveCount(0, {
    timeout: 15_000,
  });
}
