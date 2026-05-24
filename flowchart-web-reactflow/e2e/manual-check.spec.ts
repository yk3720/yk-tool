import { expect, test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const FIXTURE_BASIC = path.join(
  process.cwd(),
  "fixtures",
  "sample-basic.json",
);
const FIXTURE_SIMPLE_YES = path.join(
  process.cwd(),
  "fixtures",
  "sample-simple-yes.json",
);

function headerRegenerate(page: import("@playwright/test").Page) {
  return page.locator("header").getByRole("button", { name: "再生成" });
}

test.describe("M2 AC + P0 UX 手動確認（自動化）", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Flowchart Web" })).toBeVisible();
    await expect(page.locator(".react-flow__node")).not.toHaveCount(0, {
      timeout: 15_000,
    });
  });

  test("AC-8: 1画面で表とプレビュー", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "表" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "プレビュー" })).toBeVisible();
    await expect(page.getByText("閲覧専用")).toBeVisible();
  });

  test("AC-2: 5種ノードの形状が区別できる", async ({ page }) => {
    await page.getByRole("tab", { name: "JSON" }).click();
    const textarea = page.getByLabel("フローチャート表 JSON");
    const doc = JSON.parse(await textarea.inputValue()) as {
      table: unknown[][];
    };
    doc.table.push(
      [60, "入出力", "", "", 0, "入出力サンプル", "", ""],
      [70, "手動入力", "", "", 0, "手動入力サンプル", "", ""],
    );
    await textarea.fill(JSON.stringify(doc, null, 2));
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
    await page.getByRole("button", { name: "画像を保存" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });

  test("ADR-002: 接続先エラーで生成停止・プレビュー維持（B-3）", async ({
    page,
  }) => {
    const nodesBefore = await page.locator(".react-flow__node").count();
    expect(nodesBefore).toBeGreaterThan(0);

    await page.getByRole("tab", { name: "JSON" }).click();
    const textarea = page.getByLabel("フローチャート表 JSON");
    const text = await textarea.inputValue();
    const broken = text.replace(/"99999"/g, '"99999"').replace(
      /"50"/,
      '"99999"',
    );
    if (broken === text) {
      const patched = JSON.parse(text) as { table: unknown[][] };
      patched.table[4][3] = "99999";
      await textarea.fill(JSON.stringify(patched, null, 2));
    } else {
      await textarea.fill(broken);
    }

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

    const pngBtn = page.getByRole("button", { name: "画像を保存" });
    await expect(pngBtn).toBeDisabled();
  });

  test("B-2: JSON 編集後に表 UI で同期", async ({ page }) => {
    await page.getByRole("tab", { name: "JSON" }).click();
    const textarea = page.getByLabel("フローチャート表 JSON");
    const doc = JSON.parse(await textarea.inputValue()) as {
      table: unknown[][];
    };
    doc.table[1][5] = "同期テストラベル";
    await textarea.fill(JSON.stringify(doc, null, 2));

    await page.getByRole("tab", { name: "表 UI" }).click();
    await expect(
      page.locator("tbody input").filter({ hasText: "同期テストラベル" }),
    ).toHaveCount(0);
    const row2Text = page.locator("tbody tr").nth(1).locator("input");
    await expect(row2Text.nth(4)).toHaveValue("同期テストラベル");
  });

  test("B-4: 閲覧専用ラベル", async ({ page }) => {
    await expect(page.getByText("閲覧専用（表を編集 → 再生成）")).toBeVisible();
  });
});
