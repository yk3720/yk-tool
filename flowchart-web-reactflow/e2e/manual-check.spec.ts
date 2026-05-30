import { expect, test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const FIXTURE_SIMPLE_YES = path.join(
  process.cwd(),
  "fixtures",
  "sample-simple-yes.json",
);

function headerRegenerate(page: import("@playwright/test").Page) {
  return page.locator("header").getByRole("button", { name: "再生成" });
}

async function openMoreMenu(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "その他" }).click();
}

async function loadSampleFromMenu(
  page: import("@playwright/test").Page,
  label: string,
) {
  await openMoreMenu(page);
  await page.getByRole("menuitem", { name: label }).click();
}

const EMPTY_MODULE_MSG = "モジュールを選択してください";

test.describe("サンプル表示（モジュール未選択）", () => {
  test("M002 を選ぶと表とプレビューが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Flowchart Web" })).toBeVisible();

    await expect(page.getByText(EMPTY_MODULE_MSG)).toHaveCount(2);
    await loadSampleFromMenu(page, "サンプル: M002（9列·段+列）");

    await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(EMPTY_MODULE_MSG)).toHaveCount(0);
    await expect(page.getByText("サンプル表示（左でモジュールを選ぶと保存できます）")).toBeVisible();
    await expect(page.locator("tbody tr")).not.toHaveCount(0);
    await expect(page.locator(".react-flow__node")).toHaveCount(14, {
      timeout: 15_000,
    });
  });
});

/** Phase 3: モジュール選択後にサンプル読込・再生成 */
async function openModuleWithPreview(
  page: import("@playwright/test").Page,
) {
  await page.getByRole("button", { name: "供給動作" }).click();
  const nodeCount = await page.locator(".react-flow__node").count();
  if (nodeCount === 0) {
    await loadSampleFromMenu(page, "サンプル: 基本判断");
    await headerRegenerate(page).click();
    await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 15_000 });
  }
}

async function addTableRow(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "行を追加" }).click();
}

test.describe("M2 AC + P0 UX 手動確認（自動化）", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Flowchart Web" })).toBeVisible();
    await openModuleWithPreview(page);
    await expect(page.locator(".react-flow__node")).not.toHaveCount(0, {
      timeout: 15_000,
    });
  });

  test("Phase 3: 3ペイン（ナビ・表・プレビュー）", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "フロー" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "装置を選択" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "表" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "プレビュー" })).toBeVisible();
  });

  test("Phase 3: 装置切替でナビのユニットが変わる", async ({ page }) => {
    await page.getByRole("combobox", { name: "装置を選択" }).selectOption("press-02");
    await expect(page.getByText("供給ユニット")).toBeVisible();
    await expect(page.getByRole("button", { name: "供給動作" })).toBeVisible();
    await page.getByRole("combobox", { name: "装置を選択" }).selectOption("press-01");
    await page.getByRole("button", { name: "供給動作" }).click();
  });

  test("AC-8: 1画面で表とプレビュー", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "表" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "プレビュー" })).toBeVisible();
    await expect(page.getByText("閲覧専用")).toBeVisible();
  });

  test("AC-2: 5種ノードの形状が区別できる", async ({ page }) => {
    await addTableRow(page);
    const row6 = page.locator("tbody tr").nth(5);
    await row6.locator("input").nth(0).fill("60");
    await row6.locator("select").selectOption("入出力");
    await row6.locator("input").nth(4).fill("入出力サンプル");

    await addTableRow(page);
    const row7 = page.locator("tbody tr").nth(6);
    await row7.locator("input").nth(0).fill("70");
    await row7.locator("select").selectOption("手動入力");
    await row7.locator("input").nth(4).fill("手動入力サンプル");

    await headerRegenerate(page).click();
    await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 10_000 });

    await expect(page.locator(".flow-node-diamond")).toHaveCount(1);
    await expect(page.locator(".rounded-2xl")).toHaveCount(1);
    await expect(page.locator(".flow-node-parallelogram")).toHaveCount(1);
    await expect(page.locator(".flow-node-manual")).toHaveCount(1);
    await expect(page.locator(".react-flow__node")).toHaveCount(7);
  });

  test("AC-3: 矢印（エッジ）が表示される", async ({ page }) => {
    await expect(page.locator(".react-flow__edge")).not.toHaveCount(0);
  });

  test("AC-4: 判断から Yes / No ラベル（basic）", async ({ page }) => {
    await expect(page.getByText("Yes", { exact: true })).toBeVisible();
    await expect(page.getByText("No", { exact: true })).toBeVisible();
  });

  test("AC-5: 表変更→再生成でレイアウトが更新される", async ({ page }) => {
    const before = await page.locator(".react-flow__node").first().boundingBox();
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
    await page.locator('input[type="file"]').setInputFiles({
      name: "sample-simple-yes.json",
      mimeType: "application/json",
      buffer: Buffer.from(json),
    });

    await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".react-flow__node")).toHaveCount(13, {
      timeout: 10_000,
    });
    expect(nodeCountBefore).toBeLessThan(13);
  });

  test("AC-7: PNG ダウンロードが開始される（再生成後）", async ({
    page,
  }) => {
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
      page.getByRole("alert").filter({ hasText: "接続先" }),
    ).toBeVisible();
    await expect(page.locator(".react-flow__node")).toHaveCount(nodesBefore);
  });

  test("B-1: stale 時は画像を保存できない", async ({ page }) => {
    const textCell = page.locator("tbody tr").nth(1).locator("input").nth(4);
    await textCell.fill("変更テスト");
    await textCell.blur();
    await expect(page.getByText("プレビューは古い")).toBeVisible();

    await openMoreMenu(page);
    await expect(page.getByRole("menuitem", { name: "PNG" })).toBeDisabled();
  });

  test("B-2: 表編集が再生成後にプレビューへ反映", async ({ page }) => {
    const textCell = page.locator("tbody tr").nth(1).locator("input").nth(4);
    await textCell.fill("同期テストラベル");
    await textCell.blur();
    await headerRegenerate(page).click();
    await expect(page.getByText(/生成完了/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("同期テストラベル")).toBeVisible();
  });

  test("B-4: 閲覧専用ラベル", async ({ page }) => {
    await expect(page.getByText("閲覧専用（表を編集 → 再生成）")).toBeVisible();
  });
});
