import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const outputDirectory = resolve('dist-articles-test');
const command = process.platform === 'win32' ? { command: process.env.ComSpec ?? 'cmd.exe', args: ['/d', '/s', '/c', 'npx astro build --outDir dist-articles-test'] } : { command: 'npx', args: ['astro', 'build', '--outDir', 'dist-articles-test'] };
let html = '';
beforeAll(() => { rmSync(outputDirectory, { recursive: true, force: true }); execFileSync(command.command, command.args, { cwd: resolve('.'), stdio: 'pipe' }); html = readFileSync(resolve(outputDirectory, 'articles/index.html'), 'utf8'); }, 120_000);
afterAll(() => { rmSync(outputDirectory, { recursive: true, force: true }); });
describe('built articles route', () => {
  it('ships one current truthful empty list page', () => {
    expect(existsSync(resolve(outputDirectory, 'articles/index.html'))).toBe(true); expect(html).toContain('href="/articles/" aria-current="page"');
    expect(html).toContain('data-empty-collection="notes"'); expect(html).not.toMatch(/data-article-(discovery|card|search|tag)|articles\.ts|<img|<video|<picture|<source/i);
  });
  it('recursively emits no article detail output or fabricated/private placeholders', () => {
    expect(readdirSync(resolve(outputDirectory, 'articles'))).toEqual(['index.html']);
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    expect(main).not.toMatch(/placeholder|TODO|TBD|sample|views|likes|read time|contact@example/i);
  });
});
