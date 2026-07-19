import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SITE } from '../src/config/site';

const approvedGithub = 'https://github.com/zhouhaot';

const outputDirectory = resolve('dist-portfolio-about-test');
const buildCommand =
  process.platform === 'win32'
    ? {
        command: process.env.ComSpec ?? 'cmd.exe',
        args: ['/d', '/s', '/c', 'npx astro build --outDir dist-portfolio-about-test'],
      }
    : { command: 'npx', args: ['astro', 'build', '--outDir', 'dist-portfolio-about-test'] };

let portfolioHtml = '';
let aboutHtml = '';
let portfolio: Document;
let about: Document;
const rawForbiddenMarkers =
  /mailto:|tel:|resume|简历|学历|学校|电话|邮箱|客户|testimonial|placeholder|TODO|TBD|coming soon/i;
const unverifiedMetric = /\d+%/;

beforeAll(() => {
  rmSync(outputDirectory, { recursive: true, force: true });
  execFileSync(buildCommand.command, buildCommand.args, { cwd: resolve('.'), stdio: 'pipe' });
  portfolioHtml = readFileSync(resolve(outputDirectory, 'portfolio/index.html'), 'utf8');
  aboutHtml = readFileSync(resolve(outputDirectory, 'about/index.html'), 'utf8');
  portfolio = document.implementation.createHTMLDocument();
  about = document.implementation.createHTMLDocument();
  portfolio.documentElement.innerHTML = portfolioHtml;
  about.documentElement.innerHTML = aboutHtml;
}, 120_000);

afterAll(() => {
  rmSync(outputDirectory, { recursive: true, force: true });
});

describe('built portfolio and anonymous about routes', () => {
  it('creates both public routes with one heading, canonical URLs, and current navigation', () => {
    expect(existsSync(resolve(outputDirectory, 'portfolio/index.html'))).toBe(true);
    expect(existsSync(resolve(outputDirectory, 'about/index.html'))).toBe(true);
    for (const [page, path] of [
      [portfolio, '/portfolio/'],
      [about, '/about/'],
    ] as const) {
      expect(page.querySelectorAll('h1')).toHaveLength(1);
      expect(page.querySelector(`a[href="${path}"][aria-current="page"]`)).not.toBeNull();
      expect(page.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE.url}${path}`);
    }
  });

  it('keeps the empty portfolio truthful, with no media, gallery, dialog, or lightbox hook', () => {
    expect(portfolio.querySelector('[data-empty-state][data-empty-collection="portfolio"]')).not.toBeNull();
    expect(
      portfolio.querySelectorAll('article, figure, img, picture, source, video, [data-portfolio-gallery], dialog'),
    ).toHaveLength(0);
    expect(portfolioHtml).not.toMatch(
      /data-portfolio-gallery|data-lightbox-items|initPortfolioLightboxes|coming soon/i,
    );
    expect(portfolio.querySelector('[data-portfolio-primary-cta]')?.getAttribute('href')).toBe(approvedGithub);
    expect(portfolio.querySelector('[data-portfolio-secondary-cta]')?.getAttribute('href')).toBe('/projects/');
  });

  it('renders six anonymous about sections with GitHub before projects and no private or fabricated content', () => {
    expect(
      Array.from(about.querySelectorAll('[data-about-section]'), (section) =>
        section.getAttribute('data-about-section'),
      ),
    ).toEqual(['positioning', 'capabilities', 'method', 'principles', 'current-status', 'trust-boundary']);
    const primary = about.querySelector<HTMLAnchorElement>('[data-about-primary-cta]');
    const secondary = about.querySelector<HTMLAnchorElement>('[data-about-secondary-cta]');
    expect(primary?.getAttribute('href')).toBe(approvedGithub);
    expect(readFileSync(resolve('src/config/site.ts'), 'utf8')).not.toMatch(/githubUrl/);
    expect(secondary?.getAttribute('href')).toBe('/projects/');
    if (!primary || !secondary) throw new Error('About CTA controls are required.');
    expect(Boolean(primary.compareDocumentPosition(secondary) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(aboutHtml).not.toMatch(rawForbiddenMarkers);
    const publicAbout = about.documentElement.cloneNode(true) as HTMLElement;
    publicAbout.querySelectorAll('script, style').forEach((element) => element.remove());
    expect(publicAbout.outerHTML).not.toMatch(/\d+%|<img|<video/i);
    expect(aboutHtml).not.toMatch(/(?:react|vue)(?:\.|-|\/)/i);
  });

  it('keeps raw-marker scanning separate from visible-content metric scanning', () => {
    expect('<script>简历</script>').toMatch(rawForbiddenMarkers);
    expect('<script>TODO</script>').toMatch(rawForbiddenMarkers);
    expect('<style>.card { width: 100%; }</style>').not.toMatch(rawForbiddenMarkers);
    const styleOnly = document.implementation.createHTMLDocument();
    styleOnly.documentElement.innerHTML = '<style>.card { width: 100%; }</style>';
    styleOnly.querySelector('style')?.remove();
    expect(styleOnly.documentElement.outerHTML).not.toMatch(unverifiedMetric);
    expect('<p>95%</p>').toMatch(unverifiedMetric);
  });
});
