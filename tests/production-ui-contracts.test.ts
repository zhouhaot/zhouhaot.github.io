// @vitest-environment node

import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SITE } from '../src/config/site';
import { collections } from '../src/content.config';
import { portfolioSchema } from '../src/domain/content-schema';
import { PUBLIC_ROUTES, articleRoute, projectRoute } from '../src/domain/routes';

const portfolioEntry = {
  title: 'Workflow map',
  summary: 'A licensed visual record of an approved workflow.',
  publishedAt: '2026-07-18',
  draft: false,
  order: 0,
  status: 'published',
  items: [
    {
      type: 'image',
      source: 'workflow-map.webp',
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
            source: 'workflow-map.webp',
            alt: 'A workflow map showing the approved process.',
            width: 1600,
            height: 900,
          },
        ],
      }),
    ).toThrow();
  });

  it('registers an empty portfolio collection without example entries', () => {
    expect(collections).toHaveProperty('portfolio');
    expect(readdirSync(resolve('src/content/portfolio'))).toEqual(['.gitkeep']);
  });

  it('keeps public configuration free of legacy branding, placeholders, and private profile fields', () => {
    const routesPath = resolve('src/domain/routes.ts');
    const publicSource = [readFileSync(resolve('src/config/site.ts'), 'utf8'), readFileSync(routesPath, 'utf8')].join(
      '\n',
    );

    expect(publicSource).not.toMatch(/LAB\.LOG|VOID\.DEV|TODO|TBD|placeholder/i);
    expect(publicSource).not.toMatch(/realName|email|resumeUrl|school|phone|client/i);
  });
});
