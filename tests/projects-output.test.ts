import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const outputDirectory = resolve('dist-projects-test');
const buildCommand =
  process.platform === 'win32'
    ? {
        command: process.env.ComSpec ?? 'cmd.exe',
        args: ['/d', '/s', '/c', 'npx astro build --outDir dist-projects-test'],
      }
    : { command: 'npx', args: ['astro', 'build', '--outDir', 'dist-projects-test'] };

let document: Document;
let html = '';

beforeAll(() => {
  rmSync(outputDirectory, { recursive: true, force: true });
  execFileSync(buildCommand.command, buildCommand.args, { cwd: resolve('.'), stdio: 'pipe' });
  html = readFileSync(resolve(outputDirectory, 'projects/index.html'), 'utf8');
  document = window.document.implementation.createHTMLDocument();
  document.documentElement.innerHTML = html;
}, 120_000);

afterAll(() => {
  rmSync(outputDirectory, { recursive: true, force: true });
});

describe('built projects route', () => {
  it('renders one heading, shared navigation, and a truthful empty state when collections are empty', () => {
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    expect(document.querySelector('a[href="/projects/"][aria-current="page"]')).not.toBeNull();
    expect(document.querySelector('[data-empty-state][data-empty-collection="projects"]')).not.toBeNull();
    expect(document.querySelectorAll('[data-project-card]')).toHaveLength(0);
    expect(document.querySelector('[data-project-filters]')).toBeNull();
  });

  it('does not fabricate project details or ship private, placeholder, or sample content', () => {
    expect(existsSync(resolve(outputDirectory, 'projects/index.html'))).toBe(true);
    expect(existsSync(resolve(outputDirectory, 'projects/workflow-assistant/index.html'))).toBe(false);
    expect(html).not.toMatch(/placeholder|TODO|TBD|sample|contact@example\.com|简历|邮箱/i);
    expect(html).not.toMatch(/<img|<video|<picture|<source/i);
  });
});
