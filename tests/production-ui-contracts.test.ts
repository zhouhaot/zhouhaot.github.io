// @vitest-environment node

import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SITE } from '../src/config/site';
import { collections } from '../src/content.config';
import { PUBLIC_ROUTES, articleRoute, workRoute } from '../src/domain/routes';

describe('production UI contracts', () => {
  it('exposes only the approved public navigation routes', () => {
    expect(PUBLIC_ROUTES).toEqual({
      home: '/',
      works: '/works/',
      blog: '/blog/',
      resume: '/resume/',
    });
    expect(SITE.navigation.map((item) => item.href)).toEqual([
      '/',
      '/works/',
      '/blog/',
      '/resume/',
    ]);
  });

  it('builds encoded work and article detail routes', () => {
    expect(workRoute('workflow assistant')).toBe('/works/workflow%20assistant/');
    expect(articleRoute('eval-basics')).toBe('/blog/eval-basics/');
  });

  it('rejects unsafe detail route ids', () => {
    for (const id of ['', '   ', '.', '..', 'nested/project', 'nested\\project']) {
      expect(() => workRoute(id)).toThrow();
      expect(() => articleRoute(id)).toThrow();
    }
  });

  it('registers the site singleton and preserves empty public entry collections', () => {
    expect(collections).toHaveProperty('site');
    for (const collection of ['works', 'notes']) {
      expect(readdirSync(resolve(`src/content/${collection}`))).toEqual(['.gitkeep']);
    }
  });

  it('keeps public configuration free of legacy branding, placeholders, and private profile fields', () => {
    const routesPath = resolve('src/domain/routes.ts');
    const publicSource = [readFileSync(resolve('src/config/site.ts'), 'utf8'), readFileSync(routesPath, 'utf8')].join(
      '\n',
    );

    expect(publicSource).not.toMatch(/LAB\.LOG|VOID\.DEV|TODO|TBD|placeholder/i);
    expect(publicSource).not.toMatch(/realName|email|resumeUrl|school|phone|client/i);
  });

  it('keeps the singleton as the only production GitHub contact source and BaseLayout as the only header owner', () => {
    const collectSources = (directory: string): string[] =>
      readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = resolve(directory, entry.name);
        return entry.isDirectory() ? collectSources(path) : [path];
      });

    const singleton = resolve('src/content/site/profile.md');
    for (const file of collectSources(resolve('src')).filter(
      (path) => /\.(?:astro|ts|mdx?)$/.test(path) && path !== singleton,
    )) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/SITE\.githubUrl|https:\/\/github\.com\/zhouhaot/);
    }

    const redundantHeaderOwners = [
      ...collectSources(resolve('src/pages')).filter((path) => path.endsWith('.astro')),
      ...collectSources(resolve('e2e/fixtures/src/pages')).filter((path) => path.endsWith('.astro')),
      resolve('src/layouts/ContentLayout.astro'),
    ];
    for (const file of redundantHeaderOwners) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/SiteHeader|slot=["']header["']/);
    }

    const fixtureContentConfig = readFileSync(resolve('e2e/fixtures/src/content.config.ts'), 'utf8');
    expect(fixtureContentConfig).toContain('siteProfileSchema');
    expect(fixtureContentConfig).toContain("base: '../../src/content/site'");
    expect(fixtureContentConfig).toMatch(/export const collections = \{ site \}/);
    expect(fixtureContentConfig).not.toMatch(/\b(?:works|notes)\b/);
  });
});
