import { expect, test } from "@playwright/test";

import { isFullyObscuredBy } from "./helpers/a11y";
import { openMoreMenu, openPreviewWithSample } from "./helpers/flowchart";

test.describe("a11y keyboard（手動 E2E · Phase 3）", () => {
  test.beforeEach(async ({ page }) => {
    await openPreviewWithSample(page);
  });

  test("その他メニュー: ArrowDown で項目移動 · Escape で閉じる", async ({
    page,
  }) => {
    await openMoreMenu(page);
    const menu = page.getByRole("menu", { name: "その他の操作" });
    await expect(menu).toBeVisible();

    const items = page.getByRole("menuitem");
    await expect(items.first()).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(items.nth(1)).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(page.getByRole("button", { name: "その他" })).toBeFocused();
  });

  test("フロープレビュー: 矢印キーで pan（2.5.7 代替）", async ({ page }) => {
    const canvas = page.getByRole("group", {
      name: /フローチャートプレビュー/,
    });
    await canvas.focus();
    await expect(canvas).toBeFocused();

    const viewport = page.locator(".react-flow__viewport");
    const before = await viewport.evaluate((el) => el.getAttribute("style"));
    await page.keyboard.press("ArrowLeft");
    await expect
      .poll(async () => viewport.evaluate((el) => el.getAttribute("style")))
      .not.toBe(before);
  });

  test("フロープレビュー: +/- で zoom", async ({ page }) => {
    const canvas = page.getByRole("group", {
      name: /フローチャートプレビュー/,
    });
    await canvas.focus();

    const viewport = page.locator(".react-flow__viewport");
    const before = await viewport.evaluate((el) => el.getAttribute("style"));
    await page.keyboard.press("=");
    await expect
      .poll(async () => viewport.evaluate((el) => el.getAttribute("style")))
      .not.toBe(before);
  });

  test("表: sticky thead 下でも Tab フォーカスが完全には隠れない（2.4.11）", async ({
    page,
  }) => {
    const scroll = page.locator(".scroll-pt-10").first();
    const thead = page.locator("thead");
    await expect(scroll).toBeVisible();

    await scroll.evaluate((el) => {
      el.scrollTop = 240;
    });

    const cell = page.getByLabel("行10 Text1");
    await cell.focus();
    await expect(cell).toBeFocused();

    await expect
      .poll(async () => {
        const cellBox = await cell.boundingBox();
        const theadBox = await thead.boundingBox();
        if (!cellBox || !theadBox) return false;
        return !isFullyObscuredBy(cellBox, theadBox);
      })
      .toBe(true);
  });
});
