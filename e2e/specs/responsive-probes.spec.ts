import { expect, test } from '@playwright/test';
import { setViewport } from '../helpers/viewports';

test.use({ hasTouch: true });

test('article TOC changes at 919px and home grid changes at 1024px', async ({ page }) => {
  await setViewport(page, 919, 900);
  await page.goto('http://127.0.0.1:4322/reader/');
  await expect(page.locator('.article-reader__toc-mobile')).toBeVisible();
  await expect(page.locator('.article-reader__toc-desktop')).toBeHidden();
  await setViewport(page, 920, 900);
  await expect(page.locator('.article-reader__toc-mobile')).toBeHidden();
  await expect(page.locator('.article-reader__toc-desktop')).toBeVisible();

  const homeColumns = async () =>
    page
      .locator('.home-grid')
      .first()
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
  await setViewport(page, 1023, 900);
  await page.goto('/');
  await expect.poll(homeColumns).toBe(1);
  await setViewport(page, 1024, 900);
  await expect.poll(homeColumns).toBe(12);
});

test('touch mobile controls meet the minimum target sizes and drawer can be tapped', async ({ page }) => {
  await setViewport(page, 390, 844);
  await page.goto('/');
  const targetSizes = await page.evaluate(() => {
    const menu = document.querySelector<HTMLElement>('[data-menu-trigger]')!.getBoundingClientRect();
    const bottom = document.querySelector<HTMLElement>('[data-mobile-navigation]')!.getBoundingClientRect();
    return { menu: { width: menu.width, height: menu.height }, bottomHeight: bottom.height };
  });
  expect(targetSizes.menu.width).toBeGreaterThanOrEqual(44);
  expect(targetSizes.menu.height).toBeGreaterThanOrEqual(44);
  expect(targetSizes.bottomHeight).toBeGreaterThanOrEqual(48);
  await page.locator('[data-menu-trigger]').tap();
  await expect(page.locator('[data-mobile-drawer]')).toHaveClass(/is-open/);
  await page.locator('[data-drawer-overlay]').tap({ position: { x: 4, y: 4 } });
  await expect(page.locator('[data-mobile-drawer]')).not.toHaveClass(/is-open/);
});
