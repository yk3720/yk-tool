import { test, expect } from '@playwright/test';

// テスト対象のURL
const REPORT_URL =
  'https://script.google.com/macros/s/AKfycbwXpvjxC0HQWKITg8tSJC_oUciA-e1U4BuTL8JJ2hdqEIvO0wMhhkjmPkgo1Osr7SvsNQ/exec';

// -------------------------------------------------------------------
// GASページの構造:
//   frame[0] = GAS外側ラッパー
//   frame[1] = userCodeAppPanel（中間ラッパー）
//   frame[2] = 実際のHTMLコンテンツ（進捗報告）← ここを操作する
// -------------------------------------------------------------------

/** frame[2]（実際のコンテンツ）を取得するヘルパー */
async function getContentFrame(page: import('@playwright/test').Page) {
  await page.goto(REPORT_URL, { waitUntil: 'networkidle', timeout: 30000 });
  // ネストされたiframeが読み込まれるまで待機
  await page.waitForTimeout(2000);
  const frames = page.frames();
  // frame[2] が実際のコンテンツ（進捗報告HTML）
  return frames[2];
}

// ===================================================================
test.describe('進捗報告HTMLレポートのテスト', () => {

  // -----------------------------------------------------------------
  // テスト1: ページが正常に読み込まれる
  //   → タイトル「進捗報告」が表示されているか確認
  // -----------------------------------------------------------------
  test('テスト1: ページタイトルが正しい', async ({ page }) => {
    const frame = await getContentFrame(page);

    // id="reportTitle" のテキストを確認
    const title = frame.locator('#reportTitle');
    await expect(title).toBeVisible({ timeout: 10000 });

    const titleText = await title.textContent();
    console.log(`✅ レポートタイトル: ${titleText}`);

    // 「進捗報告」という文字が含まれること
    expect(titleText).toContain('進捗報告');
  });

  // -----------------------------------------------------------------
  // テスト2: サマリーカード（4種類の件数）が表示されているか
  //   → 定期完了・定期対応中・トラブル対応中・トラブル確認中
  // -----------------------------------------------------------------
  test('テスト2: サマリーカードの4つの数値が表示されている', async ({ page }) => {
    const frame = await getContentFrame(page);

    // 各サマリーのIDを確認
    const summaryIds = ['sumDone', 'sumTotal', 'sumProg', 'sumTrblProg', 'sumTrblPend'];
    for (const id of summaryIds) {
      const el = frame.locator(`#${id}`);
      await expect(el).toBeVisible({ timeout: 10000 });
      const text = await el.textContent();
      console.log(`  ✅ #${id} = "${text}"`);
    }
  });

  // -----------------------------------------------------------------
  // テスト3: ガントチャートが表示されているか
  //   → .sec-hd.g に「ガントチャート」と表示されているか
  //   → .gantt-row が1件以上存在するか
  // -----------------------------------------------------------------
  test('テスト3: ガントチャートが存在する', async ({ page }) => {
    const frame = await getContentFrame(page);

    // ガントチャートのセクションヘッダー
    const ganttHeader = frame.locator('.sec-hd.g');
    await expect(ganttHeader).toBeVisible({ timeout: 10000 });
    const headerText = await ganttHeader.textContent();
    expect(headerText).toContain('ガントチャート');

    // ガントチャートの行（1件以上あること）
    const ganttRows = frame.locator('.gantt-row');
    const count = await ganttRows.count();
    console.log(`  ✅ ガントチャート行数: ${count}`);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // -----------------------------------------------------------------
  // テスト4: 定期作業テーブルが表示されているか
  //   → .rpt-tbl-planned のテーブルが存在するか
  // -----------------------------------------------------------------
  test('テスト4: 定期作業テーブルが存在する', async ({ page }) => {
    const frame = await getContentFrame(page);

    const table = frame.locator('.rpt-tbl-planned');
    await expect(table).toBeVisible({ timeout: 10000 });

    // テーブルの行数を確認
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    console.log(`  ✅ 定期作業テーブル 行数: ${rowCount}`);
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  // -----------------------------------------------------------------
  // テスト5: 不具合テーブルが表示されているか
  //   → .rpt-tbl-trouble のテーブルが存在するか
  // -----------------------------------------------------------------
  test('テスト5: 不具合テーブルが存在する', async ({ page }) => {
    const frame = await getContentFrame(page);

    const table = frame.locator('.rpt-tbl-trouble');
    await expect(table).toBeVisible({ timeout: 10000 });

    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    console.log(`  ✅ 不具合テーブル 行数: ${rowCount}`);
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  // -----------------------------------------------------------------
  // テスト6: フィルターボタンが機能するか
  //   → 装置フィルターボタンをクリックして絞り込みが動くか
  // -----------------------------------------------------------------
  test('テスト6: 装置フィルターが機能する', async ({ page }) => {
    const frame = await getContentFrame(page);

    // フィルターボタン（最初のボタン＝「全装置」が active 状態）
    const filterBar = frame.locator('#deviceFilterBar');
    await expect(filterBar).toBeVisible({ timeout: 10000 });

    // 「成形加工装置」ボタンをクリック
    const seikeiBtn = filterBar.locator('button[data-device="成形加工装置"]');
    await seikeiBtn.click();

    // クリック後に active クラスが付いていること
    await expect(seikeiBtn).toHaveClass(/active/);
    console.log('  ✅ 成形加工装置フィルターが機能しました');
  });

  // -----------------------------------------------------------------
  // テスト7: スクリーンショットを保存（PC・スマホ両方）
  // -----------------------------------------------------------------
  test('テスト7: スクリーンショット保存（PC・スマホ）', async ({ page }) => {

    // --- PCサイズ ---
    await page.setViewportSize({ width: 1280, height: 800 });
    const framePC = await getContentFrame(page);
    await framePC.locator('#reportTitle').waitFor({ timeout: 10000 });
    await page.screenshot({
      path: 'tests/screenshots/report-pc.png',
      fullPage: true,
    });
    console.log('  ✅ PC版スクリーンショット保存');

    // --- スマホサイズ（iPhone 14想定）---
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: 'tests/screenshots/report-mobile.png',
      fullPage: true,
    });
    console.log('  ✅ スマホ版スクリーンショット保存');
  });

});
