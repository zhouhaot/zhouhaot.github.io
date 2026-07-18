import { test } from '@playwright/test';
import { expectNoSeriousAxeViolations } from '../helpers/a11y';
import { setViewport } from '../helpers/viewports';

for (const width of [390, 1440]) {
  for (const route of ['/', '/projects/', '/articles/', '/portfolio/', '/about/']) {
    test(`Axe has no serious or critical violations at ${width}px for ${route}`, async ({ page }) => {
      await setViewport(page, width, 900);
      await page.goto(route);
      await expectNoSeriousAxeViolations(page);
    });
  }
}
