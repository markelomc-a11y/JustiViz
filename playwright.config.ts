import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'browser-performance.spec.ts',
  timeout: 120_000,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    ...devices['Desktop Chrome'],
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000/api/health',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  reporter: [['list']],
});
