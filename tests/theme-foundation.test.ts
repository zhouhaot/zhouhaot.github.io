// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const loadTheme = () => import('../src/domain/theme').catch(() => undefined);

const source = (path: string) => {
  try {
    return readFileSync(resolve(path), 'utf8');
  } catch {
    return '';
  }
};

describe('semantic theme foundation', () => {
  it('limits themes to light, dark, and cyber', async () => {
    const theme = await loadTheme();

    expect(theme).toBeDefined();
    expect(theme?.THEME_VALUES).toEqual(['light', 'dark', 'cyber']);
    expect(theme?.THEME_STORAGE_KEY).toBe('zhou-theme');
  });

  it('uses a valid saved preference before the system preference', async () => {
    const theme = await loadTheme();

    expect(theme).toBeDefined();
    expect(theme?.resolveTheme('cyber', true)).toBe('cyber');
    expect(theme?.resolveTheme('light', true)).toBe('light');
  });

  it('uses dark only for a system-dark fallback and never selects cyber automatically', async () => {
    const theme = await loadTheme();

    expect(theme).toBeDefined();
    expect(theme?.resolveTheme(null, true)).toBe('dark');
    expect(theme?.resolveTheme('invalid', false)).toBe('light');
    expect(theme?.resolveTheme(undefined, false)).not.toBe('cyber');
  });

  it('initializes the root theme before normal page scripts without assuming storage is available', () => {
    const layout = source('src/layouts/BaseLayout.astro');
    const initializer = layout.indexOf('THEME_STORAGE_KEY');
    const moduleScripts = layout.indexOf('type="module"');

    expect(initializer).toBeGreaterThan(-1);
    expect(initializer).toBeLessThan(moduleScripts === -1 ? Infinity : moduleScripts);
    expect(layout).toContain('document.documentElement.dataset.theme');
    expect(layout).toContain('try');
    expect(layout).toContain('localStorage.getItem');
    expect(layout).toContain('THEME_STORAGE_KEY');
  });

  it('defines semantic color and status tokens for every supported theme', () => {
    const tokens = source('src/styles/tokens.css');

    for (const theme of ['light', 'dark', 'cyber']) {
      const themeBlock = new RegExp(`html\\[data-theme=['"]${theme}['"]\\][\\s\\S]*?(?=html\\[data-theme|$)`);
      const block = tokens.match(themeBlock)?.[0] ?? '';

      for (const token of [
        '--color-background',
        '--color-surface',
        '--color-foreground',
        '--color-muted',
        '--color-border',
        '--color-accent',
        '--color-success',
        '--color-info',
        '--color-warning',
        '--color-danger',
        '--color-code-background',
        '--color-code-foreground',
      ]) {
        expect(block).toContain(token);
      }
    }
  });

  it('defines production shell and responsive gutter tokens', () => {
    const tokens = source('src/styles/tokens.css');

    expect(tokens).toContain('--layout-shell: 1240px');
    expect(tokens).toContain('--layout-reading: 720px');
    expect(tokens).toContain('--layout-gutter: 28px');
    expect(tokens).toMatch(/@media \(max-width: 767px\)[\s\S]*--layout-gutter: 18px/);
  });

  it('keeps accessible focus, skip-link, and reduced-motion defaults in the base layer', () => {
    const base = source('src/styles/base.css');

    expect(base).toContain(':focus-visible');
    expect(base).toContain('.skip-link');
    expect(base).toContain('.skip-link:focus');
    expect(base).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('loads the token, base, and component layers into the shared page shell', () => {
    const layout = source('src/layouts/BaseLayout.astro');
    const header = source('src/components/SiteHeader.astro');

    expect(layout).toContain('@/styles/tokens.css');
    expect(layout).toContain('@/styles/base.css');
    expect(layout).toContain('@/styles/components.css');
    expect(layout).toContain('class="site-shell"');
    expect(layout).toContain('class="site-main"');
    expect(header).toContain('class="site-header"');
    expect(header).toContain('class="site-wordmark"');
  });
});
