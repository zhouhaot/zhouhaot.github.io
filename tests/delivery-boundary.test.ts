// @vitest-environment node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const output = resolve('dist-delivery-test');
const build =
  process.platform === 'win32'
    ? {
        command: process.env.ComSpec ?? 'cmd.exe',
        args: ['/d', '/s', '/c', 'npx astro build --outDir dist-delivery-test'],
      }
    : { command: 'npx', args: ['astro', 'build', '--outDir', 'dist-delivery-test'] };

beforeAll(() => {
  rmSync(output, { recursive: true, force: true });
  execFileSync(build.command, build.args, { cwd: resolve('.'), stdio: 'pipe' });
}, 120_000);
afterAll(() => rmSync(output, { recursive: true, force: true }));

describe('production delivery boundary', () => {
  it('emits complete base metadata and safe JSON-LD without an image dependency', () => {
    const home = readFileSync(resolve(output, 'index.html'), 'utf8');
    expect(home).toMatch(/<link rel="canonical" href="https:\/\/zhouhaot\.github\.io\/"/);
    expect(home).toMatch(/property="og:(site_name|title|description|type|url)"/);
    expect(home).toMatch(/property="og:locale" content="zh_CN"/);
    expect(home).toMatch(/name="twitter:card" content="summary"/);
    expect(home).toMatch(/type="application\/rss\+xml"[^>]*href="\/rss\.xml"/);
    expect(home).toMatch(/name="theme-color"|name="color-scheme"/);
    expect(home).not.toMatch(/og:image|og-default\.png/);
    const jsonLd = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    expect(jsonLd).toBeTruthy();
    expect(JSON.parse(jsonLd!)).toMatchObject({ '@type': 'WebPage' });
  });

  it('emits an empty RSS channel using article-only canonical item routes', () => {
    const rss = readFileSync(resolve(output, 'rss.xml'), 'utf8');
    expect(rss).toContain('<rss');
    expect(rss).not.toContain('<item>');
    expect(rss).not.toContain('/notes/');
  });

  it('publishes crawler directives and only real sitemap routes', () => {
    expect(readFileSync(resolve(output, 'robots.txt'), 'utf8')).toContain(
      'Sitemap: https://zhouhaot.github.io/sitemap-index.xml',
    );
    expect(existsSync(resolve(output, 'sitemap-index.xml'))).toBe(true);
    const sitemap = readdirSync(output)
      .filter((file) => /^sitemap-.*\.xml$/.test(file))
      .map((file) => readFileSync(resolve(output, file), 'utf8'))
      .join('\n');
    for (const route of ['/404', '/rss.xml', '/admin', '/notes/', '/projects/example/'])
      expect(sitemap).not.toContain(route);
  });

  it('emits an accessible noindex GitHub Pages 404 page', () => {
    const html = readFileSync(resolve(output, '404.html'), 'utf8');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toMatch(/name="robots" content="noindex,follow"/);
    expect(html).toContain('https://github.com/zhouhaot');
    expect(html).toMatch(/href="\/"/);
  });

  it('renders exactly one shell header on every public static page', () => {
    for (const file of [
      'index.html',
      '404.html',
      'about/index.html',
      'articles/index.html',
      'portfolio/index.html',
      'projects/index.html',
    ]) {
      expect(readFileSync(resolve(output, file), 'utf8').match(/class="site-header"/g)).toHaveLength(1);
    }
  });

  it('pins Node 24 and deploys only the built artifact after every gate', () => {
    expect(readFileSync(resolve('.nvmrc'), 'utf8').trim()).toBe('24');
    const ci = readFileSync(resolve('.github/workflows/ci.yml'), 'utf8');
    const deploy = readFileSync(resolve('.github/workflows/deploy.yml'), 'utf8');
    for (const workflow of [ci, deploy]) {
      expect(workflow).toMatch(/node-version-file:\s*['"]?\.nvmrc/);
      expect(workflow).toMatch(
        /npm run format:check[\s\S]*npm run lint[\s\S]*npm run check[\s\S]*npm run audit:content[\s\S]*npm test[\s\S]*npm run build[\s\S]*npm run audit:production/,
      );
      expect(workflow).toMatch(/npm audit --omit=dev --audit-level=high[\s\S]*npm audit --audit-level=high/);
    }
    expect(deploy).toMatch(/path:\s*['"]?dist['"]?/);
    expect(deploy).not.toMatch(/path:\s*['"]?\.["']?/);
  });

  it('separates verification from deploy with job-scoped least permissions and a dist artifact', () => {
    const deploy = readFileSync(resolve('.github/workflows/deploy.yml'), 'utf8');
    expect(deploy).toMatch(/verify:[\s\S]*permissions:\s*[\s\S]*contents:\s*read/);
    expect(deploy).toMatch(/verify:[\s\S]*actions\/upload-artifact@[\s\S]*path:\s*dist/);
    expect(deploy).toMatch(/deploy:\s*[\s\S]*needs:\s*verify/);
    expect(deploy).toMatch(/deploy:[\s\S]*permissions:\s*[\s\S]*pages:\s*write[\s\S]*id-token:\s*write/);
    expect(deploy).not.toMatch(/deploy:[\s\S]*permissions:\s*[\s\S]*contents:\s*read/);
    expect(deploy).toMatch(/deploy:[\s\S]*actions\/download-artifact@[\s\S]*path:\s*dist/);
    expect(deploy).toMatch(/actions\/upload-pages-artifact@[\s\S]*path:\s*dist/);
  });
});
