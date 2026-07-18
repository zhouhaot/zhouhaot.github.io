import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SITE } from '../src/config/site';
import { initNavigation, isCurrentNavigationRoute } from '../src/scripts/navigation';
import { initThemeControls } from '../src/scripts/theme-controls';

const navigationLinks = SITE.navigation
  .map((item) => `<a href="${item.href}" data-drawer-link>${item.label}</a>`)
  .join('');

function renderShell(currentPath = '/') {
  document.body.innerHTML = `
    <header>
      <nav data-desktop-navigation>${SITE.navigation
        .map(
          (item) =>
            `<a href="${item.href}"${item.href === currentPath ? ' aria-current="page"' : ''}>${item.label}</a>`,
        )
        .join('')}</nav>
      <button type="button" data-menu-trigger aria-expanded="false">Open</button>
    </header>
    <div data-drawer-overlay hidden></div>
    <aside data-mobile-drawer aria-hidden="true" inert>
      <button type="button" data-drawer-close>Close</button>
      <nav>${navigationLinks}</nav>
    </aside>
    <nav data-mobile-navigation>${SITE.navigation
      .map(
        (item) => `<a href="${item.href}"${item.href === currentPath ? ' aria-current="page"' : ''}>${item.label}</a>`,
      )
      .join('')}</nav>
  `;
}

function renderThemeControls() {
  document.documentElement.dataset.theme = 'light';
  document.documentElement.style.colorScheme = 'light';
  document.body.innerHTML = `
    <div data-theme-switcher>
      <button type="button" data-theme-button="light">浅色</button>
      <button type="button" data-theme-button="dark">深色</button>
      <button type="button" data-theme-button="cyber">赛博</button>
    </div>
  `;
}

describe('responsive navigation interactions', () => {
  beforeEach(() => {
    renderShell();
  });

  it('renders the approved site navigation in desktop and mobile patterns with the current route announced', () => {
    const labels = SITE.navigation.map((item) => item.label);
    const hrefs = SITE.navigation.map((item) => item.href);

    for (const selector of ['[data-desktop-navigation]', '[data-mobile-navigation]']) {
      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(`${selector} a`));
      expect(links.map((link) => link.textContent)).toEqual(labels);
      expect(links.map((link) => link.getAttribute('href'))).toEqual(hrefs);
    }

    expect(document.querySelector('[data-desktop-navigation] a')?.getAttribute('aria-current')).toBe('page');
    expect(document.querySelector('[data-mobile-navigation] a')?.getAttribute('aria-current')).toBe('page');
  });

  it('keeps the projects and articles primary navigation current on detail routes', () => {
    expect(isCurrentNavigationRoute('/projects/', '/projects/workflow-assistant/')).toBe(true);
    expect(isCurrentNavigationRoute('/articles/', '/articles/eval-basics/')).toBe(true);
    expect(isCurrentNavigationRoute('/portfolio/', '/projects/workflow-assistant/')).toBe(false);
  });

  it('opens the closed drawer, exposes it to assistive technology, and focuses its close button', () => {
    const trigger = document.querySelector<HTMLButtonElement>('[data-menu-trigger]')!;
    const drawer = document.querySelector<HTMLElement>('[data-mobile-drawer]')!;
    const overlay = document.querySelector<HTMLElement>('[data-drawer-overlay]')!;

    initNavigation(document);
    trigger.click();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(drawer.getAttribute('aria-hidden')).toBe('false');
    expect(drawer.hasAttribute('inert')).toBe(false);
    expect(overlay.hidden).toBe(false);
    expect(document.activeElement).toBe(document.querySelector('[data-drawer-close]'));
  });

  it('closes the drawer for Escape, overlay, close button, and navigation links', () => {
    const trigger = document.querySelector<HTMLButtonElement>('[data-menu-trigger]')!;
    const drawer = document.querySelector<HTMLElement>('[data-mobile-drawer]')!;
    const overlay = document.querySelector<HTMLElement>('[data-drawer-overlay]')!;
    const close = document.querySelector<HTMLButtonElement>('[data-drawer-close]')!;
    const link = document.querySelector<HTMLAnchorElement>('[data-drawer-link]')!;

    initNavigation(document);
    trigger.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(drawer.getAttribute('aria-hidden')).toBe('true');
    expect(drawer.hasAttribute('inert')).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    overlay.click();
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    close.click();
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    link.click();
    expect(drawer.getAttribute('aria-hidden')).toBe('true');
    expect(document.activeElement).not.toBe(trigger);
  });

  it('traps Tab navigation within an open drawer', () => {
    const trigger = document.querySelector<HTMLButtonElement>('[data-menu-trigger]')!;
    const drawer = document.querySelector<HTMLElement>('[data-mobile-drawer]')!;
    const focusable = Array.from(drawer.querySelectorAll<HTMLElement>('button, a'));
    const first = focusable[0]!;
    const last = focusable.at(-1)!;

    initNavigation(document);
    trigger.click();
    last.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(first);

    first.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    expect(document.activeElement).toBe(last);
  });

  it('replaces stale navigation listeners on remount and cleans up the active listeners', () => {
    initNavigation(document);
    const cleanup = initNavigation(document);
    const trigger = document.querySelector<HTMLButtonElement>('[data-menu-trigger]')!;
    const drawer = document.querySelector<HTMLElement>('[data-mobile-drawer]')!;
    const closeButton = document.querySelector<HTMLButtonElement>('[data-drawer-close]')!;
    const focusDrawer = vi.spyOn(closeButton, 'focus');

    trigger.click();
    expect(drawer.getAttribute('aria-hidden')).toBe('false');
    expect(focusDrawer).toHaveBeenCalledTimes(1);

    const focusTrigger = vi.spyOn(trigger, 'focus');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(drawer.getAttribute('aria-hidden')).toBe('true');
    expect(focusTrigger).toHaveBeenCalledTimes(1);

    trigger.click();
    expect(drawer.getAttribute('aria-hidden')).toBe('false');

    expect(cleanup).toBeTypeOf('function');
    cleanup();
    expect(drawer.getAttribute('aria-hidden')).toBe('true');
    expect(drawer.hasAttribute('inert')).toBe(true);
    trigger.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(drawer.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('theme controls', () => {
  beforeEach(() => {
    renderThemeControls();
    localStorage.clear();
  });

  it('switches theme, native color scheme, pressed state, and persisted preference', () => {
    const setItem = vi.fn();
    initThemeControls(document, { getItem: () => null, setItem });

    expect(Array.from(document.querySelectorAll('[data-theme-button]'), (button) => button.textContent)).toEqual([
      '浅色',
      '深色',
      '赛博',
    ]);

    document.querySelector<HTMLButtonElement>('[data-theme-button="cyber"]')!.click();

    expect(document.documentElement.dataset.theme).toBe('cyber');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(setItem).toHaveBeenCalledWith('zhou-theme', 'cyber');
    expect(document.querySelector('[data-theme-button="cyber"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('[data-theme-button="light"]')?.getAttribute('aria-pressed')).toBe('false');
    expect(document.querySelector('[data-theme-switcher]')?.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);
  });

  it('continues switching when browser storage is unavailable', () => {
    initThemeControls(document, {
      getItem: () => {
        throw new Error('storage unavailable');
      },
      setItem: () => {
        throw new Error('storage unavailable');
      },
    });

    expect(() => document.querySelector<HTMLButtonElement>('[data-theme-button="dark"]')!.click()).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('uses browser storage by default', () => {
    initThemeControls(document);

    document.querySelector<HTMLButtonElement>('[data-theme-button="dark"]')!.click();

    expect(localStorage.getItem('zhou-theme')).toBe('dark');
  });

  it('replaces stale theme listeners on remount and cleans up the active listeners', () => {
    const setItem = vi.fn();
    initThemeControls(document, { getItem: () => null, setItem });
    const cleanup = initThemeControls(document, { getItem: () => null, setItem });
    const cyber = document.querySelector<HTMLButtonElement>('[data-theme-button="cyber"]')!;

    cyber.click();
    expect(setItem).toHaveBeenCalledTimes(1);

    expect(cleanup).toBeTypeOf('function');
    cleanup();
    cyber.click();
    expect(setItem).toHaveBeenCalledTimes(1);
  });
});
