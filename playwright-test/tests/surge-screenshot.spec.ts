import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const URLS = [
  { name: 'report', url: 'https://diagram-action-dashboard-report.surge.sh' },
  { name: 'detail', url: 'https://diagram-action-dashboard-detail.surge.sh' },
];

function today(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function prepareDir(dateStr: string): string {
  const dir = path.join('tests', 'screenshots', dateStr);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

test('surge.sh ページのスクリーンショットを取得', async ({ page }) => {
  const dateStr = today();
  const dir = prepareDir(dateStr);

  for (const { name, url } of URLS) {
    console.log(`\n📸 取得中: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const title = await page.title();
    console.log(`   タイトル: ${title}`);

    // PC版
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500);
    const pcPath = path.join(dir, `surge-${name}-pc.png`);
    await page.screenshot({ path: pcPath, fullPage: true });
    console.log(`✅ PC版: ${pcPath}`);

    // スマホ版
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const mobilePath = path.join(dir, `surge-${name}-mobile.png`);
    await page.screenshot({ path: mobilePath, fullPage: true });
    console.log(`✅ スマホ版: ${mobilePath}`);
  }

  console.log(`\n📁 保存先: tests/screenshots/${dateStr}/`);
});
