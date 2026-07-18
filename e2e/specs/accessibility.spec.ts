import { test } from '@playwright/test';
import { expectNoSeriousAxeViolations } from '../helpers/a11y';
import { setViewport } from '../helpers/viewports';

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark', 'cyber'] as const) {
    for (const route of ['/', '/projects/', '/articles/', '/portfolio/', '/about/']) {
      test(`Axe has no serious or critical violations at ${width}px ${theme} for ${route}`, async ({ page }) => {
        await setViewport(page, width, 900);
        await page.addInitScript((selectedTheme) => localStorage.setItem('zhou-theme', selectedTheme), theme);
        await page.goto(route);
        await expectNoSeriousAxeViolations(page);
      });
    }
  }
}

test('Axe has no serious or critical violations for interactive fixture states', async ({ page }) => {
  await setViewport(page, 390, 844);
  await page.goto('/');
  await page.locator('[data-menu-trigger]').click();
  await expectNoSeriousAxeViolations(page);
  await page.goto('http://127.0.0.1:4322/articles/');
  await page.locator('[data-article-search]').fill('no-fixture-match');
  await expectNoSeriousAxeViolations(page);
  await page.goto('http://127.0.0.1:4322/reader/');
  await expectNoSeriousAxeViolations(page);
  await page.goto('http://127.0.0.1:4322/portfolio/');
  await page.locator('[data-lightbox-trigger]').click();
  await expectNoSeriousAxeViolations(page);
});
