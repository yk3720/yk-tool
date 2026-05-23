import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const REPORT_URL =
  'https://script.google.com/macros/s/AKfycbwXpvjxC0HQWKITg8tSJC_oUciA-e1U4BuTL8JJ2hdqEIvO0wMhhkjmPkgo1Osr7SvsNQ/exec';

/** 今日の日付を「YYYY-MM-DD」形式で返す */
function today(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** 保存先フォルダを作成し、パスを返す */
function prepareDir(dateStr: string): string {
  const dir = path.join('tests', 'screenshots', dateStr);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

test('HTMLレポートのスクリーンショットを日付フォルダに保存', async ({ page }) => {
  const dateStr = today();
  const dir = prepareDir(dateStr);

  // ページ読み込み
  await page.goto(REPORT_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // frame[2] = 実際のコンテンツ
  const frames = page.frames();
  const frame = frames[2];
  await frame.locator('#reportTitle').waitFor({ timeout: 10000 });

  // --- 1. PC版（全体） ---
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const pcPath = path.join(dir, 'report-pc.png');
  await page.screenshot({ path: pcPath, fullPage: true });
  console.log(`✅ PC版:     ${pcPath}`);

  // --- 2. スマホ版（iPhone 14想定）---
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const mobilePath = path.join(dir, 'report-mobile.png');
  await page.screenshot({ path: mobilePath, fullPage: true });
  console.log(`✅ スマホ版: ${mobilePath}`);

  // --- 3. タブレット版（iPad想定）---
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const tabletPath = path.join(dir, 'report-tablet.png');
  await page.screenshot({ path: tabletPath, fullPage: true });
  console.log(`✅ タブレット版: ${tabletPath}`);

  // 保存完了サマリー
  console.log(`\n📁 保存先フォルダ: tests/screenshots/${dateStr}/`);
  console.log(`   - report-pc.png`);
  console.log(`   - report-mobile.png`);
  console.log(`   - report-tablet.png`);
});
