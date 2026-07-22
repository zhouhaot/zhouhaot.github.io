// @vitest-environment node

import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SITE } from '../src/config/site';
import { collections } from '../src/content.config';
import { portfolioSchema } from '../src/domain/content-schema';
import { PUBLIC_ROUTES, articleRoute, projectRoute } from '../src/domain/routes';

const publication = (slug: string) => ({
  slug,
  draft: false,
  attestation: {
    authenticityConfirmed: true,
    rightsConfirmed: true,
    reviewedAt: '2026-07-19',
    evidenceUrls: [],
  },
});

const portfolioEntry = {
  ...publication('workflow-map'),
  title: 'Workflow map',
  summary: 'A licensed visual record of an approved workflow.',
  publishedAt: '2026-07-18',
  order: 0,
  status: 'published',
  items: [
    {
      type: 'image',
      source: 'portfolio/workflow-map.webp',
      alt: 'A workflow map showing the approved process.',
      caption: 'An approved visual record of the workflow.',
      width: 1600,
      height: 900,
      license: 'owned',
    },
  ],
};

describe('production UI contracts', () => {
  it('exposes only the approved public navigation routes', () => {
    expect(PUBLIC_ROUTES).toEqual({
      home: '/',
      projects: '/projects/',
      articles: '/articles/',
      portfolio: '/portfolio/',
      about: '/about/',
    });
    expect(SITE.navigation.map((item) => item.href)).toEqual([
      '/',
      '/projects/',
      '/articles/',
      '/portfolio/',
      '/about/',
    ]);
  });

  it('builds encoded project and article detail routes', () => {
    expect(projectRoute('workflow assistant')).toBe('/projects/workflow%20assistant/');
    expect(articleRoute('eval-basics')).toBe('/articles/eval-basics/');
  });

  it('rejects unsafe detail route ids', () => {
    for (const id of ['', '   ', '.', '..', 'nested/project', 'nested\\project']) {
      expect(() => projectRoute(id)).toThrow();
      expect(() => articleRoute(id)).toThrow();
    }
  });

  it('requires a complete ordered portfolio media series', () => {
    const entry = portfolioSchema.parse(portfolioEntry);
    expect(entry.items).toHaveLength(1);
    expect(entry.order).toBe(0);
  });

  it('rejects remote, executable, absolute, and traversing portfolio media sources', () => {
    for (const source of [
      'https://cdn.example.com/workflow-map.webp',
      'javascript:alert(1)',
      'data:image/png;base64,unsafe',
      '/workflow-map.webp',
      '../workflow-map.webp',
    ]) {
      expect(() =>
        portfolioSchema.parse({ ...portfolioEntry, items: [{ ...portfolioEntry.items[0], source }] }),
      ).toThrow();
    }
  });

  it('rejects incomplete portfolio media metadata', () => {
    expect(() => portfolioSchema.parse({ ...portfolioEntry, items: [] })).toThrow();
    expect(() =>
      portfolioSchema.parse({
        ...portfolioEntry,
        items: [{ ...portfolioEntry.items[0], alt: '', width: 0 }],
      }),
    ).toThrow();
    expect(() =>
      portfolioSchema.parse({
        ...portfolioEntry,
        items: [
          {
            type: 'image',
            source: 'portfolio/workflow-map.webp',
            alt: 'A workflow map showing the approved process.',
            width: 1600,
            height: 900,
          },
        ],
      }),
    ).toThrow();
  });

  it('registers the site singleton and preserves empty public entry collections', () => {
    expect(collections).toHaveProperty('site');
    for (const collection of ['work', 'lab', 'notes', 'portfolio']) {
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
    expect(fixtureContentConfig).not.toMatch(/\b(?:work|lab|notes|portfolio)\b/);
  });
});
