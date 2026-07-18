import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    colorScheme: 'light',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: 'npx astro dev --host 127.0.0.1 --port 4321',
      url: 'http://127.0.0.1:4321/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npx astro dev --host 127.0.0.1 --port 4322',
      cwd: './e2e/fixtures',
      url: 'http://127.0.0.1:4322/projects/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
