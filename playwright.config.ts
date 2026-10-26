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
    channel: 'msedge',
    headless: true,
    trace: 'off',
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
