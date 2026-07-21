// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  articleNeighbours,
  buildArticleToc,
  buildArticles,
  normalizeArticleText,
  type ArticleSource,
} from '../src/domain/articles';

const publication = (slug: string) => ({
  slug,
  draft: false,
  attestation: {
    authenticityConfirmed: true,
    rightsConfirmed: true,
    reviewedAt: new Date('2026-07-19'),
    evidenceUrls: [],
  },
});

function source(overrides: Record<string, unknown> = {}): ArticleSource {
  const id = (overrides.id as string) ?? 'alpha';
  const data = overrides.data as Record<string, unknown> | undefined;
  return {
    id,
    collection: 'notes',
    data: {
      ...publication(id),
      title: 'Public title',
      summary: 'Public summary',
      publishedAt: new Date('2026-07-18'),
      tags: ['TypeScript', ' AI  tools '],
      ...data,
    },
  } as ArticleSource;
}

describe('article domain', () => {
  it('filters production drafts and sorts a copy newest first with canonical id ties', () => {
    const entries = [
      source({ id: 'zeta' }),
      source({ id: 'alpha' }),
      source({ id: 'draft', data: { draft: true, publishedAt: new Date('2026-07-19') } }),
    ];
    expect(buildArticles(entries, true).map((article) => article.id)).toEqual(['alpha', 'zeta']);
    expect(entries.map((entry) => entry.id)).toEqual(['zeta', 'alpha', 'draft']);
    expect(buildArticles(entries, false)).toHaveLength(3);
  });

  it('rejects unsafe and non-slug ids while deriving hrefs from the route builder', () => {
    expect(() => buildArticles([source({ id: 'nested/id' })], true)).toThrow(/slug/i);
    expect(() => buildArticles([source({ id: 'has space' })], true)).toThrow(/slug/i);
    expect(() => buildArticles([source({ id: 'UPPER' })], true)).toThrow(/slug/i);
    expect(buildArticles([source({ id: 'a-b' })], true)[0]?.href).toBe('/articles/a-b/');
  });

  it('normalizes search and tags while keeping public search text free of body or private fields', () => {
    const [article] = buildArticles(
      [
        source({
          data: {
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
    expect(() => buildArticles([source({ data: { tags: ['AI', ' ai '] } })], true)).toThrow(/duplicate tag/i);
  });

  it('returns non-circular previous older and next newer neighbours', () => {
    const articles = buildArticles([
      source({ id: 'new', data: { publishedAt: new Date('2026-07-20') } }),
      source({ id: 'middle', data: { publishedAt: new Date('2026-07-19') } }),
      source({ id: 'old', data: { publishedAt: new Date('2026-07-18') } }),
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
