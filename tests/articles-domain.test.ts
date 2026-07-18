// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  articleNeighbours,
  buildArticleToc,
  buildArticles,
  normalizeArticleText,
  type ArticleSource,
} from '../src/domain/articles';

const source = (overrides: Partial<ArticleSource> = {}): ArticleSource => ({
  id: 'alpha',
  collection: 'notes',
  data: {
    title: 'Public title',
    summary: 'Public summary',
    publishedAt: new Date('2026-07-18'),
    draft: false,
    tags: ['TypeScript', ' AI  tools '],
  },
  ...overrides,
});

describe('article domain', () => {
  it('filters production drafts and sorts a copy newest first with canonical id ties', () => {
    const entries = [
      source({ id: 'zeta' }),
      source({ id: 'alpha' }),
      source({ id: 'draft', data: { ...source().data, draft: true, publishedAt: new Date('2026-07-19') } }),
    ];
    expect(buildArticles(entries, true).map((article) => article.id)).toEqual(['alpha', 'zeta']);
    expect(entries.map((entry) => entry.id)).toEqual(['zeta', 'alpha', 'draft']);
    expect(buildArticles(entries, false)).toHaveLength(3);
  });

  it('rejects unsafe and canonically duplicate ids while deriving hrefs from the route builder', () => {
    expect(() => buildArticles([source({ id: 'nested/id' })], true)).toThrow(/safe/i);
    expect(() => buildArticles([source({ id: ' cafe\u0301' })], true)).toThrow(/canonical/i);
    expect(() => buildArticles([source({ id: 'CAFÉ' }), source({ id: 'café' })], true)).toThrow(/duplicate/i);
    expect(buildArticles([source({ id: 'a b' })], true)[0]?.href).toBe('/articles/a%20b/');
  });

  it('normalizes search and tags while keeping public search text free of body or private fields', () => {
    const [article] = buildArticles(
      [
        source({
          data: {
            ...source().data,
            title: 'ＡＩ  Notes',
            summary: '  Useful\nsummary ',
            tags: [' TypeScript ', 'ＡＩ'],
          },
        }),
      ],
      true,
    );
    expect(normalizeArticleText(' ＡＩ\n Tools ')).toBe('ai tools');
    expect(article?.tags).toEqual([
      { key: 'ai', label: 'ＡＩ' },
      { key: 'typescript', label: 'TypeScript' },
    ]);
    expect(article?.searchText).toBe('ai notes useful summary ai typescript');
    expect(JSON.stringify(article)).not.toMatch(/body|private/i);
    expect(() => buildArticles([source({ data: { ...source().data, tags: ['AI', ' ai '] } })], true)).toThrow(
      /duplicate tag/i,
    );
  });

  it('returns non-circular previous older and next newer neighbours', () => {
    const articles = buildArticles([
      source({ id: 'new', data: { ...source().data, publishedAt: new Date('2026-07-20') } }),
      source({ id: 'middle', data: { ...source().data, publishedAt: new Date('2026-07-19') } }),
      source({ id: 'old', data: { ...source().data, publishedAt: new Date('2026-07-18') } }),
    ]);
    expect(articleNeighbours(articles, 'middle')).toMatchObject({ previous: { id: 'old' }, next: { id: 'new' } });
    expect(articleNeighbours(articles, 'new')).toMatchObject({ previous: { id: 'middle' }, next: undefined });
  });

  it('builds h2/h3 toc entries in order and rejects invalid heading contracts', () => {
    expect(
      buildArticleToc([
        { depth: 2, slug: 'one', text: 'One' },
        { depth: 3, slug: 'two', text: 'Two' },
      ]),
    ).toEqual([
      { depth: 2, slug: 'one', text: 'One', href: '#one' },
      { depth: 3, slug: 'two', text: 'Two', href: '#two' },
    ]);
    expect(() => buildArticleToc([{ depth: 1, slug: 'title', text: 'Title' }])).toThrow(/h1/i);
    expect(() => buildArticleToc([{ depth: 2, slug: ' ', text: 'Blank' }])).toThrow(/slug/i);
    expect(() => buildArticleToc([{ depth: 2, slug: 'bad slug', text: 'Unsafe' }])).toThrow(/slug/i);
    expect(() => buildArticleToc([{ depth: 4, slug: 'bad#slug', text: 'Unsafe' }])).toThrow(/slug/i);
    expect(() =>
      buildArticleToc([
        { depth: 2, slug: 'same', text: 'One' },
        { depth: 4, slug: 'same', text: 'Two' },
      ]),
    ).toThrow(/duplicate/i);
    expect(() => buildArticleToc([{ depth: 3, slug: 'bad?slug', text: 'Unsafe' }])).toThrow(/slug/i);
    expect(() =>
      buildArticleToc([
        { depth: 2, slug: 'same', text: 'One' },
        { depth: 3, slug: 'same', text: 'Two' },
      ]),
    ).toThrow(/duplicate/i);
  });
});
