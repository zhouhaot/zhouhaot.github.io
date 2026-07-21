import type { PublicArticle } from '../../../src/domain/articles';
import type { PublicPortfolioSeries } from '../../../src/domain/portfolio';
import type { PublicProject } from '../../../src/domain/projects';

const fixturePrefix = '[QA fixture]';

export const projects: PublicProject[] = [
  {
    id: 'qa-work',
    title: `${fixturePrefix} research workspace`,
    summary: `${fixturePrefix} a bounded interface exercise.`,
    publishedAt: new Date('2026-01-01'),
    year: '2026',
    status: 'prototype',
    statusLabel: '原型',
    href: '/projects/qa-work/',
    kind: 'work',
    kindLabel: '项目',
    role: `${fixturePrefix} builder`,
    tools: ['TypeScript'],
    detailSections: [],
  },
  {
    id: 'qa-lab',
    title: `${fixturePrefix} filter laboratory`,
    summary: `${fixturePrefix} a recoverable filter state.`,
    publishedAt: new Date('2025-01-01'),
    year: '2025',
    status: 'validated',
    statusLabel: '已验证',
    href: '/projects/qa-lab/',
    kind: 'lab',
    kindLabel: '实验',
    tools: ['Astro'],
    detailSections: [],
  },
];

export const articles: PublicArticle[] = [
  {
    id: 'qa-reader',
    title: `${fixturePrefix} multi token reader`,
    summary: `${fixturePrefix} filters and a long reading surface.`,
    publishedAt: new Date('2026-02-01'),
    tags: [
      { key: 'accessibility', label: 'Accessibility' },
      { key: 'testing', label: 'Testing' },
    ],
    searchText: 'qa fixture multi token reader filters accessibility testing',
    href: '/reader/',
  },
  {
    id: 'qa-layout',
    title: `${fixturePrefix} layout notes`,
    summary: `${fixturePrefix} another searchable card.`,
    publishedAt: new Date('2026-01-15'),
    tags: [{ key: 'testing', label: 'Testing' }],
    searchText: 'qa fixture layout notes testing',
    href: '/articles/',
  },
];

export const portfolio: PublicPortfolioSeries[] = [
  {
    id: 'qa-media',
    slug: 'qa-media',
    title: `${fixturePrefix} local media`,
    summary: `${fixturePrefix} self-created SVG media.`,
    publishedAt: new Date('2026-01-01'),
    attestation: {
      authenticityConfirmed: true,
      rightsConfirmed: true,
      reviewedAt: new Date('2026-07-19'),
      evidenceUrls: [],
    },
    order: 1,
    status: 'published',
    items: [
      {
        type: 'image',
        source: '/qa-fixture.svg',
        asset: { src: '/qa-fixture.svg', width: 640, height: 360 },
        alt: `${fixturePrefix} geometric test image`,
        caption: `${fixturePrefix} local geometric image`,
        width: 640,
        height: 360,
        license: 'owned',
      },
    ],
  },
];
