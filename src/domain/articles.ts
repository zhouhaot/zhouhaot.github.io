import { articleRoute } from './routes';

export type ArticleData = {
  title: string;
  summary: string;
  publishedAt: Date;
  updatedAt?: Date | undefined;
  draft?: boolean | undefined;
  tags: string[];
};

export type ArticleSource = { id: string; collection: 'notes'; data: ArticleData };
export type ArticleTag = { key: string; label: string };
export type PublicArticle = {
  id: string;
  title: string;
  summary: string;
  publishedAt: Date;
  updatedAt?: Date | undefined;
  tags: ArticleTag[];
  searchText: string;
  href: string;
};
export type ArticleTocItem = { depth: 2 | 3; slug: string; text: string; href: string };
type AstroHeading = { depth: number; slug: string; text: string };

export function normalizeArticleText(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

function assertUniqueSafeIds(entries: readonly ArticleSource[]): void {
  const ids = new Set<string>();
  for (const entry of entries) {
    const canonical = entry.id.normalize('NFC').trim();
    articleRoute(canonical);
    if (entry.id !== canonical) throw new Error(`Article id must be canonical: ${entry.id}`);
    const key = canonical.toLowerCase();
    if (ids.has(key)) throw new Error(`Duplicate article id: ${entry.id}`);
    ids.add(key);
  }
}

function articleTags(labels: readonly string[]): ArticleTag[] {
  const tags = labels.map((label) => ({ key: normalizeArticleText(label), label: label.trim() }));
  const keys = new Set<string>();
  for (const tag of tags) {
    if (!tag.key || keys.has(tag.key)) throw new Error(`Duplicate tag: ${tag.label}`);
    keys.add(tag.key);
  }
  return tags.sort((left, right) => left.key.localeCompare(right.key, 'en'));
}

function newestFirst(left: ArticleSource, right: ArticleSource): number {
  return right.data.publishedAt.valueOf() - left.data.publishedAt.valueOf() || left.id.localeCompare(right.id, 'en');
}

function toPublicArticle(source: ArticleSource): PublicArticle {
  const tags = articleTags(source.data.tags);
  return {
    id: source.id,
    title: source.data.title,
    summary: source.data.summary,
    publishedAt: source.data.publishedAt,
    updatedAt: source.data.updatedAt,
    tags,
    searchText: normalizeArticleText([source.data.title, source.data.summary, ...tags.map((tag) => tag.label)].join(' ')),
    href: articleRoute(source.id),
  };
}

export function buildArticles(entries: readonly ArticleSource[], production = import.meta.env.PROD): PublicArticle[] {
  const published = entries.filter((entry) => !production || entry.data.draft !== true);
  assertUniqueSafeIds(published);
  return [...published].sort(newestFirst).map(toPublicArticle);
}

export function articleTagsFor(articles: readonly PublicArticle[]): ArticleTag[] {
  const tags = new Map<string, ArticleTag>();
  for (const article of articles) for (const tag of article.tags) tags.set(tag.key, tag);
  return [...tags.values()].sort((left, right) => left.key.localeCompare(right.key, 'en'));
}

export function articleNeighbours(articles: readonly PublicArticle[], id: string): { previous?: PublicArticle | undefined; next?: PublicArticle | undefined } {
  const index = articles.findIndex((article) => article.id === id);
  return index < 0 ? {} : { previous: articles[index + 1], next: articles[index - 1] };
}

export function buildArticleToc(headings: readonly AstroHeading[]): ArticleTocItem[] {
  const slugs = new Set<string>();
  const toc: ArticleTocItem[] = [];
  for (const heading of headings) {
    if (!heading.slug || heading.slug.trim() !== heading.slug || /[\s<>"'`\\/#?]/.test(heading.slug)) {
      throw new Error(`Unsafe article heading slug: ${heading.slug}`);
    }
    if (slugs.has(heading.slug)) throw new Error(`Duplicate article heading slug: ${heading.slug}`);
    slugs.add(heading.slug);
    if (heading.depth === 1) throw new Error('Article body must not contain an h1.');
    if (heading.depth !== 2 && heading.depth !== 3) continue;
    toc.push({ depth: heading.depth, slug: heading.slug, text: heading.text, href: `#${heading.slug}` });
  }
  return toc;
}
