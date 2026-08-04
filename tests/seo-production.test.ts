import { describe, expect, it } from 'vitest';
import { canonicalUrl, jsonLdScript, pageStructuredData, rssItems } from '../src/domain/seo';

describe('production SEO boundary', () => {
  it('accepts same-origin canonical paths and rejects unsafe inputs', () => {
    expect(canonicalUrl('/blog/hello/').href).toBe('https://zhouhaot.github.io/blog/hello/');
    for (const path of ['https://example.com/', '//example.com/', '/a/../private/', '/a#fragment', 'blog/']) {
      expect(() => canonicalUrl(path)).toThrow();
    }
  });

  it('serializes JSON-LD without executable script terminators or unsafe Unicode', () => {
    const unsafe = '</script><img>&\u2028\u2029';
    const script = jsonLdScript({ '@context': 'https://schema.org', name: unsafe });
    expect(script).not.toMatch(/<\/script|<img>|[\u2028\u2029]/);
    expect(JSON.parse(script)).toMatchObject({ name: unsafe });
  });

  it('creates anonymous page-specific structured data', () => {
    expect(pageStructuredData({ kind: 'home', title: 'zhou', description: 'Anonymous' })['@type']).toBe('WebPage');
    expect(
      pageStructuredData({ kind: 'article', title: 'Entry', description: 'Summary', path: '/blog/a/' })['@type'],
    ).toBe('Article');
    expect(
      pageStructuredData({ kind: 'work', title: 'Work', description: 'Summary', path: '/works/a/' })['@type'],
    ).toBe('CreativeWork');
    const profile = pageStructuredData({ kind: 'resume', title: 'Resume', description: 'Anonymous', path: '/resume/' });
    expect(profile).toMatchObject({ '@type': 'ProfilePage', mainEntity: { '@type': 'Person', name: 'zhou' } });
    expect(JSON.stringify(profile)).not.toMatch(/email|phone|address|school|identifier|customer|avatar|history/i);
  });

  it('maps published RSS items to blog routes only and allows an empty feed', () => {
    expect(rssItems([])).toEqual([]);
    expect(
      rssItems([
        {
          id: 'release',
          title: 'Release',
          summary: 'Notes',
          publishedAt: new Date('2026-07-18'),
          href: '/blog/release/',
        },
      ]),
    ).toEqual([expect.objectContaining({ link: '/blog/release/' })]);
  });
});