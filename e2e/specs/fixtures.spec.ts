import { expect, test } from '@playwright/test';
import { expectNoPageOverflow } from '../helpers/layout';
import { setViewport } from '../helpers/viewports';

const fixture = 'http://127.0.0.1:4322';

test('fixture project filters recover from zero results', async ({ page }) => {
  await page.goto(`${fixture}/projects/`);
  await page.locator('[data-project-type="lab"]').click();
  await page.locator('select[data-project-status]').selectOption('prototype');
  await expect(page.locator('[data-project-no-results]')).toBeVisible();
  await page.locator('[data-project-reset]').click();
  await expect(page.locator('[data-project-no-results]')).toBeHidden();
  await expect(page.locator('[data-project-card]')).toHaveCount(2);
});

test('fixture article discovery filters, resets, and keeps its long reader bounded', async ({ page }) => {
  await page.goto(`${fixture}/articles/`);
  await page.locator('[data-article-search]').fill('not-a-fixture-token');
  await expect(page.locator('[data-article-no-results]')).toBeVisible();
  await page.locator('[data-article-reset]').click();
  await expect(page.locator('[data-article-no-results]')).toBeHidden();
  await setViewport(page, 390, 844);
  await page.goto(`${fixture}/reader/`);
  await expect(page.locator('.article-reader__toc-mobile')).toBeVisible();
  await expectNoPageOverflow(page);
});

test('fixture lightbox opens and restores focus to its trigger', async ({ page }) => {
  await page.goto(`${fixture}/portfolio/`);
  const trigger = page.locator('[data-lightbox-trigger]');
  await trigger.click();
  await expect(page.locator('[data-portfolio-lightbox]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-portfolio-lightbox]')).toBeHidden();
  await expect(trigger).toBeFocused();
});
