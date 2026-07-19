import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { SITE } from '../src/config/site';

const approvedGithub = 'https://github.com/zhouhaot';

const buildCommand =
  process.platform === 'win32'
    ? { command: process.env.ComSpec ?? 'cmd.exe', args: ['/d', '/s', '/c', 'npm run build'] }
    : { command: 'npm', args: ['run', 'build'] };

let builtDocument: Document;
let scripts = '';

beforeAll(() => {
  execFileSync(buildCommand.command, buildCommand.args, { cwd: resolve('.'), stdio: 'pipe' });
  const html = readFileSync(resolve('dist/index.html'), 'utf8');
  builtDocument = document.implementation.createHTMLDocument();
  builtDocument.documentElement.innerHTML = html;
  scripts = Array.from(builtDocument.querySelectorAll<HTMLScriptElement>('script'))
    .map((script) => {
      const source = script.getAttribute('src');
      return source ? readFileSync(resolve(`dist${source}`), 'utf8') : (script.textContent ?? '');
    })
    .join('\n');
}, 120_000);

describe('built responsive shell', () => {
  it('renders the approved desktop and mobile links with the home route current', () => {
    for (const selector of ['[data-desktop-navigation]', '[data-mobile-navigation]']) {
      const links = Array.from(builtDocument.querySelectorAll<HTMLAnchorElement>(`${selector} a`));
      expect(links.map((link) => link.textContent)).toEqual(SITE.navigation.map((item) => item.label));
      expect(links.map((link) => link.getAttribute('href'))).toEqual(SITE.navigation.map((item) => item.href));
      expect(links[0]?.getAttribute('aria-current')).toBe('page');
    }
  });

  it('ships a closed accessible drawer and preserves GitHub outside the mobile tabbar', () => {
    const drawer = builtDocument.querySelector<HTMLElement>('[data-mobile-drawer]');
    const trigger = builtDocument.querySelector<HTMLButtonElement>('[data-menu-trigger]');
    const overlay = builtDocument.querySelector<HTMLElement>('[data-drawer-overlay]');
    const tabbar = builtDocument.querySelector<HTMLElement>('[data-mobile-navigation]');

    expect(drawer?.getAttribute('aria-hidden')).toBe('true');
    expect(drawer?.hasAttribute('inert')).toBe(true);
    expect(drawer?.querySelector('[data-drawer-close]')).not.toBeNull();
    expect(overlay?.hidden).toBe(true);
    expect(trigger?.getAttribute('aria-controls')).toBe('mobile-drawer');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(builtDocument.querySelectorAll('[data-theme-button]')).toHaveLength(6);
    expect(builtDocument.querySelectorAll('.site-header__github, .mobile-drawer__github')).toHaveLength(2);
    expect(builtDocument.querySelectorAll('.site-header')).toHaveLength(1);
    const shellContacts = Array.from(
      builtDocument.querySelectorAll<HTMLAnchorElement>('.site-header__github, .mobile-drawer__github'),
    );
    expect(shellContacts.map((link) => link.getAttribute('href'))).toEqual([approvedGithub, approvedGithub]);
    expect(shellContacts.map((link) => link.textContent)).toEqual(['GitHub', 'GitHub']);
    expect(tabbar?.querySelectorAll('a')).toHaveLength(5);
    expect(tabbar?.textContent).not.toContain('GitHub');
  });

  it('ships a client script wired to the navigation and theme control hooks', () => {
    expect(scripts).toContain('[data-menu-trigger]');
    expect(scripts).toContain('[data-theme-button]');
  });
});
