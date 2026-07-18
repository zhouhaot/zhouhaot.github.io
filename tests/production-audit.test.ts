// @vitest-environment node

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { auditProductionOutput } from '../scripts/production-audit.mjs';

const roots: string[] = [];
function fixture(files: Record<string, string>): string {
  const root = join(mkdtempSync(join(tmpdir(), 'zhou-dist-audit-')), 'dist');
  mkdirSync(root);
  roots.push(root);
  for (const [relativePath, content] of Object.entries(files)) {
    const target = join(root, relativePath);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, content);
  }
  return root;
}
function expectFailure(files: Record<string, string>, match: RegExp): void {
  expect(() => auditProductionOutput(fixture(files))).toThrow(match);
}
afterEach(() => {
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true });
});

describe('production output audit', () => {
  it('only permits a dist directory root', () => {
    expect(() => auditProductionOutput('public')).toThrow(/dist/i);
  });

  it('executes the scanner when invoked by the package audit command', () => {
    const root = fixture({ 'index.html': '<h1>zhou</h1>' });
    const output = execFileSync(process.execPath, ['scripts/production-audit.mjs', root], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    expect(output).toContain('Production output audit passed.');
  });

  it('rejects legacy, placeholder, and private markers', () => {
    expectFailure({ 'index.html': '<p>VOID.DEV TODO customer</p>' }, /marker/i);
  });

  it('rejects visible unsupported metrics but ignores CSS percentages', () => {
    expectFailure({ 'index.html': '<p>99% conversion</p>', 'site.css': '.x { width: 100%; }' }, /metric/i);
  });

  it('rejects unsafe or missing local references without network access', () => {
    expectFailure({ 'index.html': '<a href="javascript:alert(1)">x</a>' }, /reference/i);
    expectFailure({ 'index.html': '<img src="/missing.png" alt="x" width="1" height="1">' }, /missing/i);
  });

  it('rejects remote media and incomplete image or video metadata', () => {
    expectFailure(
      { 'index.html': '<img src="https://cdn.example/image.png" alt="x" width="1" height="1">' },
      /remote/i,
    );
    expectFailure({ 'index.html': '<img src="/a.png">', 'a.png': '' }, /alt/i);
    expectFailure({ 'index.html': '<video src="/a.mp4"></video>', 'a.mp4': '' }, /poster/i);
  });

  it('rejects invalid portfolio attribution and fixture leakage', () => {
    expectFailure(
      {
        'index.html': '<img data-portfolio-media src="/a.png" alt="x" width="1" height="1" data-license="unknown">',
        'a.png': '',
      },
      /license/i,
    );
    expectFailure({ 'index.html': '<p>[QA fixture] /notes/ qa-fixture.svg</p>' }, /fixture/i);
  });

  it('rejects forbidden markers in JSON-LD public data', () => {
    expectFailure({ 'index.html': '<script type="application/ld+json">{"name":"VOID.DEV"}</script>' }, /marker/i);
  });

  it('rejects remote Open Graph media in metadata content', () => {
    expectFailure({ 'index.html': '<meta property="og:image" content="https://cdn.example/og.png">' }, /remote/i);
  });

  it('rejects remote media in srcset candidates', () => {
    expectFailure(
      {
        'index.html':
          '<img src="/image.png" srcset="https://cdn.example/image.png 2x" alt="Image" width="1" height="1">',
        'image.png': '',
      },
      /remote/i,
    );
  });

  it('rejects remote media referenced by public CSS', () => {
    expectFailure({ 'site.css': '.hero { background-image: url(https://cdn.example/hero.png); }' }, /remote/i);
  });

  it('rejects a remote stylesheet href by tag purpose', () => {
    expectFailure({ 'index.html': '<link rel="stylesheet" href="https://cdn.example/site.css">' }, /remote/i);
  });

  it('rejects remote CSS imports in quoted and url forms', () => {
    expectFailure({ 'site.css': '@import "https://cdn.example/site.css";' }, /remote/i);
    expectFailure({ 'site.css': '@import url(https://cdn.example/site.css);' }, /remote/i);
  });

  it('rejects protocol-relative values before local path resolution', () => {
    expectFailure({ 'index.html': '<img src="//cdn.example/image.png" alt="Image" width="1" height="1">' }, /unsafe/i);
  });

  it('rejects forbidden markers in public XML output', () => {
    expectFailure({ 'sitemap.xml': '<urlset><url><loc>VOID.DEV</loc></url></urlset>' }, /marker/i);
  });

  it('rejects remote JSON-LD and XML media values', () => {
    expectFailure(
      { 'index.html': '<script type="application/ld+json">{"image":"https://cdn.example/image.png"}</script>' },
      /remote/i,
    );
    expectFailure({ 'feed.xml': '<rss><image><url>https://cdn.example/image.png</url></image></rss>' }, /remote/i);
  });

  it('requires a directory link to resolve to index.html', () => {
    const root = fixture({ 'index.html': '<a href="/empty/">Empty</a>' });
    mkdirSync(join(root, 'empty'));
    expect(() => auditProductionOutput(root)).toThrow(/missing/i);
  });

  it('checks cross-page fragments in the target document', () => {
    expectFailure(
      { 'index.html': '<a href="/about/#missing">About</a>', 'about/index.html': '<h1 id="about">About</h1>' },
      /fragment/i,
    );
  });

  for (const metric of ['3x', '3×', '4 min read-time', '8% conversion']) {
    it(`rejects the unsupported visible metric ${metric}`, () => {
      expectFailure({ 'index.html': `<p>${metric}</p>` }, /metric/i);
    });
  }

  for (const metric of ['3&times;', '3&#215;', '3 conversion', '3 conversions']) {
    it(`decodes and rejects the unsupported visible metric ${metric}`, () => {
      expectFailure({ 'index.html': `<p>${metric}</p>` }, /metric/i);
    });
  }

  it('does not treat metric-looking script or style text as visible content', () => {
    expect(() =>
      auditProductionOutput(
        fixture({
          'index.html': '<script>const metric = "3× conversion";</script><style>.x::after{content:"3x"}</style>',
        }),
      ),
    ).not.toThrow();
  });

  it('uses the real portfolio DOM attributes for media attribution', () => {
    const gallery = readFileSync('src/components/portfolio/PortfolioGallery.astro', 'utf8');
    expect(gallery).toMatch(/data-portfolio-media/);
    expect(gallery).toMatch(/data-license-url/);
    expect(gallery).toMatch(/data-evidence-url/);
  });

  for (const [name, attrs] of [
    ['unknown license', 'data-license="unknown"'],
    ['licensed credit', 'data-license="licensed" data-license-url="https://example.com/license"'],
    [
      'licensed HTTPS license URL',
      'data-license="licensed" data-credit="Source" data-license-url="http://example.com/license"',
    ],
    ['cc-by credit', 'data-license="cc-by" data-license-url="https://example.com/license"'],
    ['public-domain evidence', 'data-license="public-domain"'],
  ]) {
    it(`rejects portfolio media with missing ${name}`, () => {
      expectFailure(
        {
          'index.html': `<img data-portfolio-media src="/image.png" alt="Image" width="1" height="1" ${attrs}>`,
          'image.png': '',
        },
        /license|attribution|evidence/i,
      );
    });
  }

  for (const [name, attrs] of [
    ['owned', 'data-license="owned"'],
    ['licensed', 'data-license="licensed" data-credit="Source" data-license-url="https://example.com/license"'],
    ['cc-by', 'data-license="cc-by" data-credit="Source" data-license-url="https://example.com/license"'],
    ['public-domain', 'data-license="public-domain" data-evidence-url="https://example.com/evidence"'],
  ]) {
    it(`accepts the schema-valid ${name} portfolio attribution combination`, () => {
      expect(() =>
        auditProductionOutput(
          fixture({
            'index.html': `<img data-portfolio-media src="/image.png" alt="Image" width="1" height="1" ${attrs}>`,
            'image.png': '',
          }),
        ),
      ).not.toThrow();
    });
  }
});
