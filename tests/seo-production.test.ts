import { describe, expect, it } from 'vitest';
import { canonicalUrl, jsonLdScript, pageStructuredData, rssItems } from '../src/domain/seo';

describe('production SEO boundary', () => {
  it('accepts same-origin canonical paths and rejects unsafe inputs', () => {
    expect(canonicalUrl('/articles/hello/').href).toBe('https://zhouhaot.github.io/articles/hello/');
    for (const path of ['https://example.com/', '//example.com/', '/a/../private/', '/a#fragment', 'articles/']) {
      expect(() => canonicalUrl(path)).toThrow();
    }
  });

  it('serializes JSON-LD without executable script terminators or unsafe Unicode', () => {
    const script = jsonLdScript({ '@context': 'https://schema.org', name: '</script><img>&\u2028\u2029' });
    expect(script).not.toMatch(/<\/script|<img>|[\u2028\u2029]/);
    expect(JSON.parse(script)).toMatchObject({ name: '</script><img>&\u2028\u2029' });
  });

  it('creates anonymous page-specific structured data', () => {
    expect(pageStructuredData({ kind: 'home', title: 'zhou', description: 'Anonymous' })['@type']).toBe('WebPage');
    expect(
      pageStructuredData({ kind: 'article', title: 'Entry', description: 'Summary', path: '/articles/a/' })['@type'],
    ).toBe('Article');
    expect(
      pageStructuredData({ kind: 'project', title: 'Work', description: 'Summary', path: '/projects/a/' })['@type'],
    ).toBe('CreativeWork');
    const profile = pageStructuredData({ kind: 'about', title: 'About', description: 'Anonymous', path: '/about/' });
    expect(profile).toMatchObject({ '@type': 'ProfilePage', mainEntity: { '@type': 'Person', name: 'zhou' } });
    expect(JSON.stringify(profile)).not.toMatch(/email|phone|address|school|identifier|customer|avatar|history/i);
  });

  it('maps published RSS items to article routes only and allows an empty feed', () => {
    expect(rssItems([])).toEqual([]);
    expect(
      rssItems([
        {
          id: 'release',
          title: 'Release',
          summary: 'Notes',
          publishedAt: new Date('2026-07-18'),
          href: '/articles/release/',
        },
      ]),
    ).toEqual([expect.objectContaining({ link: '/articles/release/' })]);
  });
});
