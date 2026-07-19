import { expect, test } from '@playwright/test';
import { expectNoPageOverflow } from '../helpers/layout';
import { setViewport } from '../helpers/viewports';

const fixture = 'http://127.0.0.1:4322';

test('fixture pages inherit exactly one shared header', async ({ page }) => {
  for (const path of ['/articles/', '/portfolio/', '/projects/', '/reader/']) {
    await page.goto(`${fixture}${path}`);
    await expect(page.locator('.site-header')).toHaveCount(1);
  }
});

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

test('fixture discovery supports multi-token and multi-tag AND filtering with persisted grid view', async ({
  page,
}) => {
  await page.goto(`${fixture}/articles/`);
  await page.locator('[data-article-search]').fill('multi reader');
  await page.locator('[data-article-tag="accessibility"]').click();
  await page.locator('[data-article-tag="testing"]').click();
  await expect(page.locator('[data-article-card]:not([hidden])')).toHaveCount(1);
  await page.locator('[data-article-view="grid"]').click();
  await expect(page.locator('[data-article-discovery]')).toHaveAttribute('data-view', 'grid');
  await page.reload();
  await expect(page.locator('[data-article-discovery]')).toHaveAttribute('data-view', 'grid');
});

test('layout helper reports a local scroller whose outer box leaves the viewport', async ({ page }) => {
  await setViewport(page, 390, 844);
  await page.goto(`${fixture}/reader/`);
  await page.evaluate(() => {
    const pre = document.querySelector<HTMLElement>('.article-content pre')!;
    pre.style.setProperty('max-inline-size', 'none', 'important');
    pre.style.setProperty('inline-size', '500px', 'important');
  });
  await expect(expectNoPageOverflow(page)).rejects.toThrow();
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

test('fixture lightbox has a distinct modal surface and separated touch controls at 390px', async ({ page }) => {
  await setViewport(page, 390, 844);
  await page.goto(`${fixture}/portfolio/`);
  await page.locator('[data-lightbox-trigger]').click();

  const presentation = await page.locator('[data-portfolio-lightbox]').evaluate((dialog) => {
    const element = dialog as HTMLDialogElement;
    const rect = element.getBoundingClientRect();
    const styles = getComputedStyle(element);
    const backdrop = getComputedStyle(element, '::backdrop');
    const controls = Array.from(
      element.querySelectorAll<HTMLElement>('[data-lightbox-close], [data-lightbox-previous], [data-lightbox-next]'),
    ).map((control) => {
      const controlRect = control.getBoundingClientRect();
      return {
        left: controlRect.left,
        right: controlRect.right,
        top: controlRect.top,
        bottom: controlRect.bottom,
        width: controlRect.width,
        height: controlRect.height,
      };
    });
    return {
      modal: element.matches(':modal'),
      rect,
      padding: styles.padding,
      gap: styles.gap,
      backdrop: backdrop.backgroundColor,
      controls,
    };
  });

  expect(presentation.modal).toBe(true);
  expect(presentation.rect.left).toBeGreaterThanOrEqual(12);
  expect(presentation.rect.right).toBeLessThanOrEqual(378);
  expect(Number.parseFloat(presentation.padding)).toBeGreaterThan(0);
  expect(Number.parseFloat(presentation.gap)).toBeGreaterThan(0);
  expect(presentation.backdrop).not.toBe('rgba(0, 0, 0, 0)');
  expect(presentation.controls).toHaveLength(3);
  for (const control of presentation.controls) {
    expect(control.width).toBeGreaterThanOrEqual(44);
    expect(control.height).toBeGreaterThanOrEqual(44);
  }
  for (const [index, control] of presentation.controls.entries()) {
    for (const other of presentation.controls.slice(index + 1)) {
      expect(
        control.right <= other.left ||
          other.right <= control.left ||
          control.bottom <= other.top ||
          other.bottom <= control.top,
      ).toBe(true);
    }
  }
});
