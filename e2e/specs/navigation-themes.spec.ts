import { expect, test } from '@playwright/test';
import { setViewport } from '../helpers/viewports';

test('mobile drawer is inert while closed and returns focus after Escape', async ({ page }) => {
  await setViewport(page, 390, 844);
  await page.goto('/');
  const trigger = page.locator('[data-menu-trigger]');
  const drawer = page.locator('[data-mobile-drawer]');
  await expect(drawer).toHaveAttribute('inert', '');
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(drawer).not.toHaveAttribute('inert', '');
  await expect(page.locator('[data-drawer-close]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveAttribute('inert', '');
  await expect(trigger).toBeFocused();
});

test('explicit Cyber selection persists across reload without a theme mismatch', async ({ page }) => {
  await setViewport(page, 1440, 900);
  await page.goto('/');
  await page.locator('[data-theme-button="cyber"]').first().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'cyber');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'cyber');
});

test('reduced motion suppresses nonessential transitions and smooth scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const motion = await page.evaluate(() => {
    const styles = getComputedStyle(document.querySelector('.site-wordmark')!);
    return {
      duration: styles.transitionDuration,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    };
  });
  expect(Number.parseFloat(motion.duration)).toBeLessThanOrEqual(0.01);
  expect(motion.scrollBehavior).toBe('auto');
});
