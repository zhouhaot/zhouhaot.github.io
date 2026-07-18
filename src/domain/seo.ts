import { SITE } from '../config/site';

export type SeoPageKind = 'home' | 'list' | 'article' | 'project' | 'portfolio' | 'about';

export type StructuredData = Record<string, unknown>;

export function canonicalUrl(path: string): URL {
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('#') ||
    path.includes('?') ||
    path.split('/').includes('..')
  ) {
    throw new Error(`Canonical path must be a safe absolute path: ${path}`);
  }

  const url = new URL(path, SITE.url);
  if (url.origin !== new URL(SITE.url).origin)
    throw new Error(`Canonical path must remain on the site origin: ${path}`);
  return url;
}

const jsonEscapes: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

export function jsonLdScript(value: StructuredData): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => jsonEscapes[character] ?? character);
}

export function pageStructuredData({
  kind,
  title,
  description,
  path = '/',
}: {
  kind: SeoPageKind;
  title: string;
  description: string;
  path?: string;
}): StructuredData {
  const url = canonicalUrl(path).href;
  const common = { '@context': 'https://schema.org', name: title, description, url };

  switch (kind) {
    case 'article':
      return { ...common, '@type': 'Article' };
    case 'project':
    case 'portfolio':
      return { ...common, '@type': 'CreativeWork' };
    case 'about':
      return { ...common, '@type': 'ProfilePage', mainEntity: { '@type': 'Person', name: SITE.name } };
    case 'home':
    case 'list':
      return { ...common, '@type': 'WebPage' };
  }
}

export type RssArticle = {
  id: string;
  title: string;
  summary: string;
  publishedAt: Date;
  href: string;
};

export function rssItems(articles: readonly RssArticle[]) {
  return articles.map((article) => {
    if (!article.href.startsWith('/articles/') || !article.href.endsWith('/')) {
      throw new Error(`RSS articles must use /articles/[id]/ routes: ${article.href}`);
    }
    return { title: article.title, description: article.summary, pubDate: article.publishedAt, link: article.href };
  });
}
