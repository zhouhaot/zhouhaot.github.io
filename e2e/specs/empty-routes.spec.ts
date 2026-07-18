import { expect, test } from '@playwright/test';
import { expectBottomNavigationClearance, expectNoPageOverflow } from '../helpers/layout';
import { productionViewports, setViewport } from '../helpers/viewports';

const routes = ['/', '/projects/', '/articles/', '/portfolio/', '/about/'];
const themes = ['light', 'dark', 'cyber'] as const;

for (const route of routes) {
  test(`empty shell ${route} has one h1, skip link, and current navigation`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.skip-link')).toHaveAttribute('href', '#main-content');
    await expect(page.locator('[data-desktop-navigation] [aria-current="page"]')).toHaveCount(1);
  });
}

for (const viewport of productionViewports) {
  for (const theme of themes) {
    test(`empty production routes stay bounded at ${viewport.name} ${theme}`, async ({ page }) => {
      await setViewport(page, viewport.width, viewport.height);
      await page.addInitScript((selectedTheme) => localStorage.setItem('zhou-theme', selectedTheme), theme);
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      for (const route of routes) {
        await page.goto(route);
        await expectNoPageOverflow(page);
        await expectBottomNavigationClearance(page);
      }
    });
  }
}
