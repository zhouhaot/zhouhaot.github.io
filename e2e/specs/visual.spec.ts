import { expect, test, type Page } from '@playwright/test';

const isWindows = process.platform === 'win32';

test.describe('approved Windows Chromium visual baselines', () => {
  test.skip(!isWindows, 'Visual snapshots are approved only for the local Windows Chromium rendering stack.');

  async function openStablePage(
    page: Page,
    url: string,
    viewport: { width: number; height: number },
    theme: 'light' | 'dark' | 'cyber',
  ) {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript((selectedTheme) => localStorage.setItem('zhou-theme', selectedTheme), theme);
    await page.goto(url);
    await page.evaluate(async () => {
      await document.fonts.ready;
      const style = document.createElement('style');
      style.textContent =
        '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}';
      document.head.append(style);
    });
  }

  for (const theme of ['light', 'dark', 'cyber'] as const) {
    test(`home 390 ${theme}`, async ({ page }) => {
      await openStablePage(page, '/', { width: 390, height: 844 }, theme);
      await expect(page).toHaveScreenshot(`home-390-${theme}.png`);
    });

    test(`home 1440 ${theme}`, async ({ page }) => {
      await openStablePage(page, '/', { width: 1440, height: 900 }, theme);
      await expect(page).toHaveScreenshot(`home-1440-${theme}.png`);
    });
  }

  test('fixture reader 390 light', async ({ page }) => {
    await openStablePage(page, 'http://127.0.0.1:4322/reader/', { width: 390, height: 844 }, 'light');
    await expect(page).toHaveScreenshot('fixture-reader-390-light.png');
  });

  test('fixture reader 1440 light', async ({ page }) => {
    await openStablePage(page, 'http://127.0.0.1:4322/reader/', { width: 1440, height: 900 }, 'light');
    await expect(page).toHaveScreenshot('fixture-reader-1440-light.png');
  });
});
