import { afterEach, describe, expect, it } from 'vitest';
import { initArticleDiscovery } from '../src/scripts/articles';

const markup = `
<section data-article-discovery data-view="list">
  <label for="article-search">Search</label><input id="article-search" data-article-search>
  <div><button type="button" data-article-tag="ai" aria-pressed="false">AI</button><button type="button" data-article-tag="ai workflow" aria-pressed="false">AI Workflow</button><button type="button" data-article-tag="ts" aria-pressed="false">TypeScript</button></div>
  <button type="button" data-article-view="list" aria-pressed="true">List</button><button type="button" data-article-view="grid" aria-pressed="false">Grid</button>
  <p data-article-result-count aria-live="polite"></p><div data-article-no-results hidden><button type="button" data-article-reset>Reset</button></div>
  <article data-article-card data-article-search-text="ai assistant typescript" data-article-tags='["ai","ai workflow","ts"]'>First</article>
  <article data-article-card data-article-search-text="ai patterns" data-article-tags='["ai"]'>Second</article>
</section>`;

const originalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');
afterEach(() => {
  document.body.innerHTML = '';
  if (originalStorage) Object.defineProperty(window, 'localStorage', originalStorage);
  localStorage.clear();
});

describe('article discovery', () => {
  it('uses normalized multi-token query and selected tags with strict AND semantics on server cards', () => {
    document.body.innerHTML = markup; initArticleDiscovery();
    const search = document.querySelector<HTMLInputElement>('[data-article-search]')!;
    search.value = 'ＡＩ   assistant'; search.dispatchEvent(new Event('input'));
    document.querySelector<HTMLButtonElement>('[data-article-tag="ts"]')!.click();
    expect(document.querySelectorAll<HTMLElement>('[data-article-card][hidden]')).toHaveLength(1);
    expect(document.querySelector<HTMLElement>('[data-article-result-count]')?.textContent).toBe('共 1 篇文章');
  });

  it('matches canonical tag keys that contain spaces without splitting them into unrelated tags', () => {
    document.body.innerHTML = markup; initArticleDiscovery();
    document.querySelector<HTMLButtonElement>('[data-article-tag="ai workflow"]')!.click();
    expect(document.querySelectorAll<HTMLElement>('[data-article-card][hidden]')).toHaveLength(1);
  });

  it('reveals a recoverable zero state and resets filters, focus, and cards without changing view', () => {
    document.body.innerHTML = markup; const cleanup = initArticleDiscovery();
    const search = document.querySelector<HTMLInputElement>('[data-article-search]')!;
    search.value = 'missing'; search.dispatchEvent(new Event('input'));
    expect(document.querySelector<HTMLElement>('[data-article-no-results]')?.hidden).toBe(false);
    document.querySelector<HTMLButtonElement>('[data-article-reset]')!.click();
    expect(search.value).toBe(''); expect(document.activeElement).toBe(search);
    expect(document.querySelectorAll('[data-article-card][hidden]')).toHaveLength(0);
    expect(document.querySelector<HTMLElement>('[data-article-discovery]')?.dataset.view).toBe('list'); cleanup();
  });

  it('moves tag focus with keys without changing selected tags', () => {
    document.body.innerHTML = markup; initArticleDiscovery();
    const ai = document.querySelector<HTMLButtonElement>('[data-article-tag="ai"]')!; ai.focus();
    ai.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(document.querySelector('[data-article-tag="ts"]'));
    expect(ai.getAttribute('aria-pressed')).toBe('false');
  });

  it('uses exclusive valid persisted views and tolerates invalid or throwing storage', () => {
    localStorage.setItem('zhou-articles-view', 'grid'); document.body.innerHTML = markup; initArticleDiscovery();
    expect(document.querySelector<HTMLElement>('[data-article-discovery]')?.dataset.view).toBe('grid');
    expect(document.querySelectorAll('[data-article-view][aria-pressed="true"]')).toHaveLength(1);
    document.querySelector<HTMLButtonElement>('[data-article-view="list"]')!.click();
    expect(localStorage.getItem('zhou-articles-view')).toBe('list');
    document.body.innerHTML = markup; Object.defineProperty(window, 'localStorage', { value: { getItem() { throw new Error('nope'); }, setItem() { throw new Error('nope'); } }, configurable: true });
    expect(() => initArticleDiscovery()).not.toThrow(); expect(document.querySelector<HTMLElement>('[data-article-discovery]')?.dataset.view).toBe('list');
  });

  it('cleans earlier mounts before remounting', () => {
    document.body.innerHTML = markup; const first = initArticleDiscovery(); const second = initArticleDiscovery();
    document.querySelector<HTMLButtonElement>('[data-article-tag="ai"]')!.click();
    expect(document.querySelector('[data-article-tag="ai"]')?.getAttribute('aria-pressed')).toBe('true'); first(); second();
  });
});
