import { test, expect, chromium } from '@playwright/test';
import * as fs from 'fs';

const SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1Oz2-OBrzxhK96dEVB4Eu8uVi2qZoAo1mXbjV8YwrZjg/edit';

const SESSION_FILE = 'auth/session.json';

// -------------------------------------------------------------------
// セッションファイルの存在チェック
// -------------------------------------------------------------------
function checkSession() {
  if (!fs.existsSync(SESSION_FILE)) {
    throw new Error(
      `セッションファイルが見つかりません: ${SESSION_FILE}\n` +
      `先に「npm run setup」を実行してGoogleにログインしてください。`
    );
  }
}

// -------------------------------------------------------------------
// Googleスプレッドシートで特定のセルを選択するヘルパー
//   例: cell('B5') → B列5行目のセルをクリック
// -------------------------------------------------------------------
async function clickCell(page: import('@playwright/test').Page, cellAddress: string) {
  // 名前ボックス（左上のセル番地表示欄）をクリックして直接入力
  const nameBox = page.locator('.cell-input, .goog-inline-block.docs-ns-ml');
  await nameBox.first().click();
  await page.keyboard.press('Escape');

  // Ctrl+G or Ctrl+Enter で名前ボックスにフォーカスをあてる方法
  // → もっと確実: Ctrl+Home で先頭に戻り、Nameboxに直接タイプ
  await page.keyboard.press('Control+Home');
  // 名前ボックスに移動 (Chromeの場合は上部左のセル番地欄をクリック)
  const nameBoxLocator = page.locator('[class*="cell-input"], .waffle-name-box');
  if (await nameBoxLocator.count() > 0) {
    await nameBoxLocator.first().click();
  } else {
    // フォールバック: Ctrl+F で検索→Escで閉じてからキーナビゲーション
    // 名前ボックスはcanvas上にないので直接クリックを試みる
    await page.locator('#t-name-box, .docs-ns-ml').first().click();
  }
  await page.keyboard.selectAll();
  await page.keyboard.type(cellAddress);
  await page.keyboard.press('Enter');
}

// -------------------------------------------------------------------
// テスト: 指定行に新しいデータを入力する
// -------------------------------------------------------------------
test.use({ storageState: SESSION_FILE });

test.describe('スプレッドシートへの自動入力', () => {

  test.beforeAll(() => {
    checkSession();
  });

  // -----------------------------------------------------------------
  // テスト1: スプレッドシートが正常に開けるか確認
  // -----------------------------------------------------------------
  test('テスト1: スプレッドシートが開ける', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SESSION_FILE });
    const page = await context.newPage();

    await page.goto(SPREADSHEET_URL, { waitUntil: 'load', timeout: 30000 });

    // Googleスプレッドシートが読み込まれたことを確認
    // シートのセルエリアが表示されるまで待つ
    await page.waitForSelector('.grid-container, canvas, #waffle-grid-container', { timeout: 20000 });

    const title = await page.title();
    console.log(`✅ スプレッドシートを開きました: ${title}`);

    await context.close();
  });

  // -----------------------------------------------------------------
  // テスト2: 「状況」列に値を入力する（既存行を更新）
  //
  // スプレッドシートの構成（v5刷新後）:
  //   A: No　B: 種別　C: 装置名　D: 件名　E: 状況　F: 結果
  //   G: 起票日　H: 開始予定日　I: 完了予定日　J: ステータス
  //   K: 優先度　L: 完了数　M: 計画数
  //
  // ここでは E2（2行目の「状況」列）を更新する例を示す
  // -----------------------------------------------------------------
  test('テスト2: 指定セルの値を更新する', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SESSION_FILE });
    const page = await context.newPage();

    await page.goto(SPREADSHEET_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('.grid-container, canvas, #waffle-grid-container', { timeout: 20000 });
    await page.waitForTimeout(2000); // シート描画完了まで待機

    // --- 名前ボックスでセルに直接ジャンプ ---
    // Googleスプレッドシートの名前ボックス（左上のセル番地欄）をクリック
    const nameBox = page.locator('.waffle-name-box');
    await nameBox.click();
    await page.keyboard.press('Control+a');  // 既存テキストを全選択（正しいPlaywright API）
    await page.keyboard.type('E2');    // ← 入力したいセル番地（必要に応じて変更）
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // セルに値を入力（既存の値を上書き）
    const newValue = '全ﾕﾆｯﾄ動作確認OK（Playwright自動入力）';
    await page.keyboard.type(newValue);
    await page.keyboard.press('Enter'); // 入力確定して次の行へ
    await page.waitForTimeout(1000);

    console.log(`✅ E2 に入力しました: "${newValue}"`);

    // スクリーンショットで確認
    await page.screenshot({ path: 'tests/screenshots/spreadsheet-after-input.png' });
    console.log('✅ 入力後のスクリーンショット保存');

    await context.close();
  });

});
