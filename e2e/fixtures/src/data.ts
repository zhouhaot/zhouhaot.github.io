import type { PublicArticle } from '../../../src/domain/articles';
import type { PublicWork } from '../../../src/domain/works';

const fixturePrefix = '[QA fixture]';

export const works: PublicWork[] = [
  {
    id: 'qa-work',
    title: `${fixturePrefix} research workspace`,
    summary: `${fixturePrefix} a bounded interface exercise.`,
    publishedAt: new Date('2026-01-01'),
    year: '2026',
    kind: 'project',
    kindLabel: '项目',
    tags: ['TypeScript'],
    status: 'prototype',
    statusLabel: '原型',
    featured: false,
    href: '/works/qa-work/',
  },
  {
    id: 'qa-experiment',
    title: `${fixturePrefix} filter laboratory`,
    summary: `${fixturePrefix} a recoverable filter state.`,
    publishedAt: new Date('2025-01-01'),
    year: '2025',
    kind: 'experiment',
    kindLabel: '实验',
    tags: ['Astro'],
    status: 'validated',
    statusLabel: '已验证',
    featured: false,
    href: '/works/qa-experiment/',
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
    href: '/blog/',
  },
];
