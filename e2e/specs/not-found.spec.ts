import { expect, test } from '@playwright/test';
import { expectNoSeriousAxeViolations } from '../helpers/a11y';
import { expectNoPageOverflow } from '../helpers/layout';
import { setViewport } from '../helpers/viewports';

test('unknown routes render an accessible noindex 404 boundary', async ({ page }) => {
  await setViewport(page, 390, 844);
  const response = await page.goto('/this-route-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('[data-not-found-primary]')).toHaveAttribute('href', 'https://github.com/zhouhaot');
  await expect(page.locator('[data-not-found-secondary]')).toHaveAttribute('href', '/');
  await page.locator('[data-not-found-primary]').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-not-found-secondary]')).toBeFocused();
  await expectNoPageOverflow(page);
  await expectNoSeriousAxeViolations(page);
});
