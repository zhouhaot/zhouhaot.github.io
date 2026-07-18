import { expect, test } from '@playwright/test';
import { setViewport } from '../helpers/viewports';

test('desktop navigation starts at 768px and mobile navigation ends at 767px', async ({ page }) => {
  await setViewport(page, 767, 900);
  await page.goto('/');
  await expect(page.locator('[data-mobile-navigation]')).toBeVisible();
  await expect(page.locator('[data-desktop-navigation]')).toBeHidden();
  await setViewport(page, 768, 900);
  await expect(page.locator('[data-mobile-navigation]')).toBeHidden();
  await expect(page.locator('[data-desktop-navigation]')).toBeVisible();
});

test('project grid switches to its desktop two-column layout at 920px', async ({ page }) => {
  const columns = async () =>
    page.locator('.projects-grid').evaluate((element) =>
      getComputedStyle(element)
        .gridTemplateColumns.split(' ')
        .map((value) => Number.parseFloat(value)),
    );

  await setViewport(page, 919, 900);
  await page.goto('http://127.0.0.1:4322/projects/');
  await expect.poll(columns).toHaveLength(1);
  await setViewport(page, 920, 900);
  await expect.poll(columns).toHaveLength(2);
  const desktopColumns = await columns();
  expect(desktopColumns[0]).toBeGreaterThan(0);
  expect(desktopColumns[1]).toBeGreaterThan(0);
  expect(Math.abs(desktopColumns[0]! - desktopColumns[1]!)).toBeLessThanOrEqual(1);
});
