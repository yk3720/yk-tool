import { expect, test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

import {
  DEVICE_PRESS_A_ID,
  DEVICE_PRESS_B_ID,
  EMPTY_MODULE_MSG,
  ensureNavExpanded,
  ensureWorkspaceLoaded,
  headerRegenerate,
  loadSampleFromMenu,
  openMoreMenu,
  openPreviewWithSample,
} from "./helpers/flowchart";
import { analyzeA11y, assertAxeGate } from "./helpers/a11y";

const FIXTURE_SIMPLE_YES = path.join(
  process.cwd(),
  "fixtures",
  "sample-simple-yes.json"
);

async function addTableRow(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "行を追加" }).click();
}

test.describe("サンプル表示（モジュール未選択）", () => {
  test("カレーサンプルを選ぶと表とプレビューが表示される", async ({ page }) => {
    await ensureWorkspaceLoaded(page);

    await expect(page.getByText(EMPTY_MODULE_MSG)).toHaveCount(2);
    await loadSampleFromMenu(page, "例を見る: カレーの作り方");

    await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(EMPTY_MODULE_MSG)).toHaveCount(0);
    await expect(
      page.getByText(/例をプレビュー中（未保存）/).first()
    ).toBeVisible();
    await expect(page.locator("tbody tr")).not.toHaveCount(0);
    await expect(page.locator(".react-flow__node")).toHaveCount(15, {
      timeout: 15_000,
    });
  });
});

test.describe("M2 AC + P0 UX 手動確認（自動化）", () => {
  test.beforeEach(async ({ page }) => {
    await openPreviewWithSample(page);
  });

  test("Phase 3: 3ペイン（ナビ・表・プレビュー）", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "フロー" })).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "装置を選択" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "表" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "プレビュー" })
    ).toBeVisible();
  });

  test("Phase 3: 装置切替でナビのユニットが変わる", async ({ page }) => {
    await ensureNavExpanded(page);
    await page
      .getByRole("combobox", { name: "装置を選択" })
      .selectOption(DEVICE_PRESS_B_ID);
    await expect(page.getByText("供給ユニット")).toBeVisible();
    await expect(page.getByRole("button", { name: "供給動作" })).toBeVisible();
    await page
      .getByRole("combobox", { name: "装置を選択" })
      .selectOption(DEVICE_PRESS_A_ID);
    await expect(page.getByText("供給ユニット")).toBeVisible();
    await expect(page.getByRole("button", { name: "供給動作" })).toBeVisible();
  });

  test("AC-8: 1画面で表とプレビュー", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "表" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "プレビュー" })
    ).toBeVisible();
    await expect(
      page.getByText(/例をプレビュー中（未保存）/).first()
    ).toBeVisible();
  });

  test("AC-2: 5種ノードの形状が区別できる", async ({ page }) => {
    await addTableRow(page);
    const row16 = page.locator("tbody tr").nth(15);
    await row16.getByLabel("行16 ID").fill("140");
    await row16.getByLabel("行16 図形種別").selectOption("入出力");
    await row16.getByLabel("行16 Text1").fill("入出力サンプル");

    await addTableRow(page);
    const row17 = page.locator("tbody tr").nth(16);
    await row17.getByLabel("行17 ID").fill("150");
    await row17.getByLabel("行17 図形種別").selectOption("手動入力");
    await row17.getByLabel("行17 Text1").fill("手動入力サンプル");

    await headerRegenerate(page).click();
    await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 10_000 });

    await expect(page.locator(".flow-node-diamond")).toHaveCount(3);
    await expect(page.locator(".flow-node-parallelogram")).toHaveCount(2);
    await expect(page.locator(".flow-node-manual")).toHaveCount(2);
    await expect(page.locator(".react-flow__node")).toHaveCount(17);
  });

  test("AC-3: 矢印（エッジ）が表示される", async ({ page }) => {
    await expect(page.locator(".react-flow__edge")).not.toHaveCount(0);
  });

  test("AC-4: 判断から Yes / No ラベル", async ({ page }) => {
    await expect(page.locator('[data-edge-label-text="Yes"]')).toHaveCount(3);
    await expect(page.locator('[data-edge-label-text="No"]')).toHaveCount(3);
  });

  test("AC-5: 表変更→再生成でレイアウトが更新される", async ({ page }) => {
    const before = await page
      .locator(".react-flow__node")
      .first()
      .boundingBox();
    const firstInput = page.locator("tbody input").first();
    await firstInput.fill("999");
    await firstInput.blur();
    await expect(page.getByText("プレビューは古い")).toBeVisible();
    await headerRegenerate(page).click();
    await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 10_000 });
    const after = await page.locator(".react-flow__node").first().boundingBox();
    expect(before).toBeTruthy();
    expect(after).toBeTruthy();
  });

  test("AC-1 / AC-6: JSON 読込で同じ図が復元", async ({ page }) => {
    const json = fs.readFileSync(FIXTURE_SIMPLE_YES, "utf-8");
    const nodeCountBefore = await page.locator(".react-flow__node").count();

    await page.getByRole("button", { name: "表を読込" }).click();
    await page.locator('input[type="file"][accept*="json"]').setInputFiles({
      name: "sample-simple-yes.json",
      mimeType: "application/json",
      buffer: Buffer.from(json),
    });

    await expect(page.getByText(/生成完了 — ノード 13/)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator(".react-flow__node")).toHaveCount(13, {
      timeout: 15_000,
    });
    expect(nodeCountBefore).toBe(15);
  });

  test("AC-7: PNG ダウンロードが開始される（再生成後）", async ({ page }) => {
    await headerRegenerate(page).click();
    await expect(page.getByText(/生成完了/)).toBeVisible();

    const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
    await openMoreMenu(page);
    await page.getByRole("menuitem", { name: "PNG" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });

  test("ADR-002: 接続先エラーで生成停止・プレビュー維持（B-3）", async ({
    page,
  }) => {
    const nodesBefore = await page.locator(".react-flow__node").count();
    expect(nodesBefore).toBeGreaterThan(0);

    const brokenRow = page.locator("tbody tr").nth(4);
    await brokenRow.locator("input").nth(2).fill("99999");
    await brokenRow.locator("input").nth(2).blur();

    await headerRegenerate(page).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "接続先" })
    ).toBeVisible();
    await expect(page.locator(".react-flow__node")).toHaveCount(nodesBefore);
  });

  test("B-1: stale 時は画像を保存できない", async ({ page }) => {
    const textCell = page.getByLabel("行2 Text1");
    await textCell.fill("変更テスト");
    await textCell.blur();
    await expect(page.getByText("プレビューは古い")).toBeVisible();

    await openMoreMenu(page);
    await expect(page.getByRole("menuitem", { name: "PNG" })).toBeDisabled();
  });

  test("B-2: 表編集が再生成後にプレビューへ反映", async ({ page }) => {
    const textCell = page.getByLabel("行2 Text1");
    await textCell.fill("同期テストラベル");
    await textCell.blur();
    await headerRegenerate(page).click();
    await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("同期テストラベル")).toBeVisible();
  });

  test("表: Excel 範囲の部分貼り付け", async ({ page }) => {
    await openPreviewWithSample(page);
    const anchor = page.getByLabel("行2 Text1");
    await anchor.click();

    await page.evaluate(() => {
      const text = "貼付A\t貼付B\n行3A\t";
      const dt = new DataTransfer();
      dt.setData("text/plain", text);
      const event = new ClipboardEvent("paste", {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
      });
      document.activeElement?.dispatchEvent(event);
    });

    await expect(page.getByLabel("行2 Text1")).toHaveValue("貼付A");
    await expect(page.getByLabel("行2 Text2")).toHaveValue("貼付B");
    await expect(page.getByLabel("行3 Text1")).toHaveValue("行3A");
  });

  test("B-4: サンプルプレビュー時のモード表示", async ({ page }) => {
    await expect(
      page.getByText(/例をプレビュー中（未保存）/).first()
    ).toBeVisible();
    await expect(headerRegenerate(page)).toBeEnabled();
  });

  test("axe: サンプルプレビュー chrome（serious gate）", async ({ page }) => {
    const results = await analyzeA11y(page);
    assertAxeGate(results);
  });
});
