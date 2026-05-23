/**
 * Googleセッション保存スクリプト（初回だけ実行）
 *
 * 実行方法（Windowsのスタートメニューから「PowerShell」を開いて実行）:
 *   cd c:\yk-tool\playwright-test
 *   node auth/setup.js
 */

const { chromium } = require('@playwright/test');
const readline = require('readline');

const SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1Oz2-OBrzxhK96dEVB4Eu8uVi2qZoAo1mXbjV8YwrZjg/edit';

const SESSION_FILE = 'auth/session.json';

async function main() {
  console.log('=== Googleセッション保存ツール ===\n');
  console.log('ブラウザが開きます。Googleアカウントにログインしてください。');
  console.log('スプレッドシートが表示されたら、このターミナルに戻ってEnterを押してください。\n');

  // 自動化検知フラグを無効化してChromeを起動
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: [
      '--disable-blink-features=AutomationControlled',  // webdriverフラグを隠す
      '--no-sandbox',
      '--disable-infobars',
      '--start-maximized',
    ],
    ignoreDefaultArgs: ['--enable-automation'],  // 「自動化中」バナーを非表示
  });
  const context = await browser.newContext({
    // 通常のChromeと同じUser-Agentを設定
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  });

  // navigator.webdriver を undefined に書き換える
  const page0 = await context.newPage();
  await page0.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  await page0.close();
  const page = await context.newPage();

  // スプレッドシートを開く（ここでログイン画面が出る）
  await page.goto(SPREADSHEET_URL);

  // ユーザーがログインするまで待機
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise(resolve => {
    rl.question('ログイン完了後、Enterを押してください...', () => {
      rl.close();
      resolve();
    });
  });

  // ログイン状態（クッキー＋localStorage）を保存
  await context.storageState({ path: SESSION_FILE });
  console.log(`\n✅ セッションを保存しました: ${SESSION_FILE}`);
  console.log('次回からは npm run spreadsheet で自動入力できます。');

  await browser.close();
}

main().catch(console.error);
