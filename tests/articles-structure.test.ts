// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('article route structure', () => {
  it('keeps the article view model at build time and uses Astro supplied headings', () => {
    const detail = readFileSync(resolve('src/pages/blog/[id].astro'), 'utf8');
    const domain = readFileSync(resolve('src/domain/articles.ts'), 'utf8');
    expect(detail).toMatch(/await render\(entry\)/);
    expect(detail).toContain('headings');
    expect(detail).toContain('buildArticleToc(headings)');
    expect(domain).not.toMatch(/slugify/i);
  });
  it('renders one heading and semantic reader contracts with responsive toc components', () => {
    const reader = readFileSync(resolve('src/components/articles/ArticleReader.astro'), 'utf8');
    const card = readFileSync(resolve('src/components/articles/ArticleCard.astro'), 'utf8');
    const discovery = readFileSync(resolve('src/components/articles/ArticleDiscovery.astro'), 'utf8');
    const index = readFileSync(resolve('src/pages/blog/index.astro'), 'utf8');
    const css = readFileSync(resolve('src/styles/articles.css'), 'utf8');
    expect(reader).toMatch(/<article/);
    expect(reader).toMatch(/<h1/);
    expect(reader).toMatch(/<progress/);
    expect(reader).toMatch(/<nav[^>]+aria-label/);
    expect(reader).toMatch(/<details/);
    expect(css).toMatch(/@media \(min-width: 920px\)/);
    expect(css).toMatch(/@media \(max-width: 919px\)/);
    expect(discovery).toMatch(/<ul[^>]*article-discovery__items/);
    expect(discovery).toMatch(/<li>/);
    expect(reader).toContain('aria-label="标签"');
    expect(card).toContain('aria-label="标签"');
    expect(index).not.toMatch(/>Articles</);
  });
});
