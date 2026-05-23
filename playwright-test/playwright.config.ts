import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: 'html',
  use: {
    // ブラウザ操作の様子をスクリーンショットで記録（失敗時のみ）
    screenshot: 'only-on-failure',
    // テスト失敗時にトレースを記録
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
