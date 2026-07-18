import { expect, type Page } from '@playwright/test';

type OverflowOffender = { tag: string; className: string; left: number; right: number; width: number };

export async function expectNoPageOverflow(page: Page) {
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const viewport = root.clientWidth;
    const offenders = Array.from(document.querySelectorAll<HTMLElement>('body *')).flatMap((element) => {
      const rect = element.getBoundingClientRect();
      const scrollContainer = element.closest<HTMLElement>('pre, table');
      const localScroller = Boolean(
        scrollContainer && /(auto|scroll)/.test(getComputedStyle(scrollContainer).overflowX),
      );
      const hiddenByState = Boolean(element.closest('[aria-hidden="true"], [hidden]'));
      if (
        !hiddenByState &&
        !localScroller &&
        (rect.left < -1 || rect.right > viewport + 1) &&
        rect.width > 0 &&
        rect.height > 0
      ) {
        return [
          { tag: element.tagName, className: element.className, left: rect.left, right: rect.right, width: rect.width },
        ];
      }
      return [];
    });
    return { clientWidth: viewport, scrollWidth: root.scrollWidth, offenders };
  });
  expect(
    result.scrollWidth,
    `scrollWidth ${result.scrollWidth}, clientWidth ${result.clientWidth}`,
  ).toBeLessThanOrEqual(result.clientWidth + 1);
  expect(result.offenders as OverflowOffender[]).toEqual([]);
}

export async function expectBottomNavigationClearance(page: Page) {
  const covered = await page.evaluate(() => {
    const bottomNav = document.querySelector<HTMLElement>('[data-mobile-navigation]');
    if (!bottomNav || getComputedStyle(bottomNav).display === 'none') return false;
    const lastFocusable = Array.from(
      document.querySelectorAll<HTMLElement>('main a[href], main button, main input, main select'),
    )
      .filter((element) => !element.hidden)
      .at(-1);
    if (!lastFocusable) return false;
    lastFocusable.focus();
    const navRect = bottomNav.getBoundingClientRect();
    const targetRect = lastFocusable.getBoundingClientRect();
    return targetRect.bottom > navRect.top + 1;
  });
  expect(covered).toBe(false);
}
