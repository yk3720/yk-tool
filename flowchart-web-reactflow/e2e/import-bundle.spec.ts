import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import {
  ensureWorkspaceLoaded,
  importBundleJsonFile,
  openMoreMenu,
} from "./helpers/flowchart";

const IMPORT_FIXTURE = path.join(
  process.cwd(),
  "tools/excel_normalize/fixtures/import-z00001.json"
);

const A0001_IMPORT = path.join(
  process.cwd(),
  "tools/excel_normalize/fixtures/devices/A0001_塗布装置/import.json"
);

test.describe("import.json 装置一括取込", () => {
  test.beforeEach(async ({ page }) => {
    await ensureWorkspaceLoaded(page);
  });

  test("その他メニューに import.json 取込項目がある", async ({ page }) => {
    await openMoreMenu(page);
    await expect(
      page.getByRole("menuitem", { name: "import.json を取込…" })
    ).toBeVisible();
  });

  test("AUTH_DISABLED 時はメニュー項目が無効", async ({ page }) => {
    await openMoreMenu(page);
    const item = page.getByRole("menuitem", { name: "import.json を取込…" });
    await expect(item).toBeDisabled();
    await expect(item.locator("span")).toHaveAttribute(
      "title",
      "クラウド未設定のため取込できません"
    );
  });

  test("fixture import.json で取込成功バナーが表示される", async ({ page }) => {
    const json = fs.readFileSync(IMPORT_FIXTURE, "utf-8");
    await importBundleJsonFile(page, {
      name: "import-z00001.json",
      buffer: Buffer.from(json),
    });

    await expect(page.getByText("取込完了: Z00001（フロー 4 件）")).toBeVisible(
      { timeout: 15_000 }
    );
  });

  test("A0001 import.json で取込成功バナーが表示される", async ({ page }) => {
    test.skip(
      !fs.existsSync(A0001_IMPORT),
      "npm run excel:a0001:build で import.json を生成してください"
    );

    const json = fs.readFileSync(A0001_IMPORT, "utf-8");
    await importBundleJsonFile(page, {
      name: "import.json",
      buffer: Buffer.from(json),
    });

    await expect(page.getByText("取込完了: A0001（フロー 4 件）")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("不正な JSON では取込失敗バナーが表示される", async ({ page }) => {
    await importBundleJsonFile(page, {
      name: "broken.json",
      buffer: Buffer.from('{"internal_code":"X"}'),
    });

    await expect(page.getByText(/取込失敗/)).toBeVisible({ timeout: 15_000 });
  });
});
