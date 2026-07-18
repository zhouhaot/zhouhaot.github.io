// @vitest-environment node

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
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
});
