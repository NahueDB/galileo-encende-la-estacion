import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    viewport: { width: 1366, height: 768 },
    browserName: process.env.TEST_BROWSER === 'webkit' ? 'webkit' : 'chromium',
    channel: ['webkit', 'chromium'].includes(process.env.TEST_BROWSER || '') ? undefined : 'msedge',
    headless: true,
    trace: 'off',
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
