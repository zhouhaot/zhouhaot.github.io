import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const approvedGithub = 'https://github.com/zhouhaot';

const buildCommand =
  process.platform === 'win32'
    ? { command: process.env.ComSpec ?? 'cmd.exe', args: ['/d', '/s', '/c', 'npm run build'] }
    : { command: 'npm', args: ['run', 'build'] };

let builtDocument: Document;
let builtHtml = '';
let builtSource = '';
let builtPublicContent = '';
let builtCss = '';
const rawForbiddenMarkers = /LAB\.LOG|VOID\.DEV|placeholder|TODO|TBD|contact@example\.com|客户/i;
const unverifiedMetric = /\d+%/;

beforeAll(() => {
  execFileSync(buildCommand.command, buildCommand.args, { cwd: resolve('.'), stdio: 'pipe' });
  builtHtml = readFileSync(resolve('dist/index.html'), 'utf8');
  builtSource = builtHtml;
  builtDocument = document.implementation.createHTMLDocument();
  builtDocument.documentElement.innerHTML = builtHtml;
  builtCss = [
    ...Array.from(builtDocument.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map((link) =>
      readFileSync(resolve(`dist${link.getAttribute('href')}`), 'utf8'),
    ),
    ...Array.from(builtDocument.querySelectorAll<HTMLStyleElement>('style')).map((style) => style.textContent ?? ''),
  ].join('\n');
  const publicDocument = builtDocument.documentElement.cloneNode(true) as HTMLElement;
  publicDocument.querySelectorAll('style, script').forEach((element) => element.remove());
  builtPublicContent = publicDocument.outerHTML;
}, 120_000);

describe('built production homepage', () => {
  it('renders the approved positioning and prioritises GitHub over works', () => {
    const headings = builtDocument.querySelectorAll('h1');
    const primary = builtDocument.querySelector<HTMLAnchorElement>('[data-home-primary-cta]');
    const secondary = builtDocument.querySelector<HTMLAnchorElement>('[data-home-secondary-cta]');

    expect(headings).toHaveLength(1);
    expect(headings[0]?.textContent).toContain('探索技术边界，让 AI 真正进入业务。');
    expect(builtDocument.body.textContent).toContain('AI 应用开发者');
    expect(primary?.textContent).toContain('访问 GitHub');
    expect(primary?.getAttribute('href')).toBe(approvedGithub);
    expect(readFileSync(resolve('src/config/site.ts'), 'utf8')).not.toMatch(/githubUrl/);
    expect(primary?.getAttribute('rel')).toContain('external');
    expect(secondary?.textContent).toContain('查看作品');
    expect(secondary?.getAttribute('href')).toBe('/works/');
  });

  it('renders the approved sections in content order with named headings', () => {
    const sections = Array.from(builtDocument.querySelectorAll<HTMLElement>('[data-home-section]'));

    expect(sections.map((section) => section.dataset.homeSection)).toEqual([
      'hero',
      'featured-works',
      'capability-map',
      'delivery-method',
      'latest-articles',
      'current-status',
    ]);

    for (const section of sections) {
      const headingId = section.getAttribute('aria-labelledby');
      expect(headingId).toBeTruthy();
      expect(builtDocument.getElementById(headingId ?? '')).not.toBeNull();
    }
  });

  it('shows truthful empty states for all empty collections without fabricating cards', () => {
    const emptyStates = Array.from(builtDocument.querySelectorAll('[data-empty-state]'));

    expect(emptyStates).toHaveLength(2);
    expect(emptyStates.map((emptyState) => emptyState.getAttribute('data-empty-collection')).sort()).toEqual([
      'notes',
      'works',
    ]);
    expect(emptyStates.every((emptyState) => emptyState.hasAttribute('role') === false)).toBe(true);
    expect(builtDocument.querySelectorAll('[data-home-content-card]')).toHaveLength(0);
    expect(builtDocument.querySelectorAll('img, video, picture, source')).toHaveLength(0);
  });

  it('does not ship prohibited legacy, placeholder, private-contact, or unverified-result content', () => {
    expect(builtSource).not.toMatch(rawForbiddenMarkers);
    expect(builtPublicContent).not.toMatch(
      /LAB\.LOG|VOID\.DEV|placeholder|TODO|TBD|contact@example\.com|客户|\d+%/i,
    );
  });

  it('keeps raw-source marker scanning separate from visible-content metrics', () => {
    expect('<script>TODO</script>').toMatch(rawForbiddenMarkers);
    expect('<style>.card { width: 100%; }</style>').not.toMatch(rawForbiddenMarkers);
    expect('<style>客户</style>').toMatch(rawForbiddenMarkers);
    const styleOnlyDocument = document.implementation.createHTMLDocument();
    styleOnlyDocument.documentElement.innerHTML = '<style>.card { width: 100%; }</style>';
    styleOnlyDocument.querySelector('style')?.remove();
    expect(styleOnlyDocument.documentElement.outerHTML).not.toMatch(unverifiedMetric);
    expect('<p>95%</p>').toMatch(unverifiedMetric);
  });

  it('ships a token-based bento layout that stacks before 1024px without remote assets or framework runtime', () => {
    expect(builtCss).toContain('.home-grid');
    expect(builtCss).toContain('var(--color-surface)');
    expect(builtCss).toMatch(/@media\s*\((?:max-width:\s*1023px|width\s*<=\s*1023px)\)/);
    expect(builtCss).toMatch(/grid-template-columns:\s*1fr/);
    expect(
      Array.from(builtDocument.querySelectorAll<HTMLElement>('[src], link[rel="stylesheet"][href]')).some((element) =>
        /^https?:/.test(element.getAttribute('src') ?? element.getAttribute('href') ?? ''),
      ),
    ).toBe(false);
    expect(builtSource).not.toMatch(/react|vue/i);
  });

  it('uses complete Direction C grid rows and a high-contrast semantic primary CTA', () => {
    expect(Array.from(builtDocument.querySelectorAll('.home-grid'), (grid) => grid.className)).toEqual([
      'home-grid home-grid--hero',
      'home-grid home-grid--capabilities',
      'home-grid home-grid--footer',
    ]);
    expect(builtCss).toMatch(
      /\.home-button--primary\{[^}]*background:var\(--color-foreground\)[^}]*color:var\(--color-background\)/,
    );
  });
});
