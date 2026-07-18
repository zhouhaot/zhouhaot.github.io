import { afterEach, describe, expect, it, vi } from 'vitest';
import { initArticleReader } from '../src/scripts/articles';

const markup = '<article data-article-reader><progress data-article-progress max="100" value="0"></progress><p data-article-copy-status aria-live="polite"></p><div class="article-content"><pre><code>const answer = 42;</code></pre></div></article>';
afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); });

describe('article reader', () => {
  it('clamps progress, completes short content, coalesces frame work, and cleans listeners', () => {
    document.body.innerHTML = markup; const reader = document.querySelector<HTMLElement>('[data-article-reader]')!;
    Object.defineProperty(reader, 'getBoundingClientRect', { value: () => ({ top: 0, height: 100 }) });
    Object.defineProperty(reader.querySelector('.article-content')!, 'getBoundingClientRect', { value: () => ({ top: -100, height: 1000 }) });
    Object.defineProperty(window, 'innerHeight', { value: 500, configurable: true });
    const raf = vi.fn((callback: FrameRequestCallback) => { callback(1); return 3; }); const cancel = vi.fn();
    const cleanup = initArticleReader(document, { requestFrame: raf, cancelFrame: cancel });
    expect(document.querySelector<HTMLProgressElement>('[data-article-progress]')?.value).toBeGreaterThan(0);
    window.dispatchEvent(new Event('scroll')); window.dispatchEvent(new Event('resize')); expect(raf).toHaveBeenCalled(); cleanup(); expect(cancel).toHaveBeenCalled();
  });

  it('adds one plain-text copy button, announces outcomes, and remains remount safe', async () => {
    document.body.innerHTML = markup; const writeText = vi.fn().mockResolvedValue(undefined);
    initArticleReader(document, { clipboard: { writeText } }); initArticleReader(document, { clipboard: { writeText } });
    expect(document.querySelectorAll('[data-article-copy]')).toHaveLength(1);
    document.querySelector<HTMLButtonElement>('[data-article-copy]')!.click(); await Promise.resolve();
    expect(writeText).toHaveBeenCalledWith('const answer = 42;'); expect(document.querySelector('[data-article-copy-status]')?.textContent).toMatch(/已复制/);
  });

  it('announces copy failure and is a no-op without code', async () => {
    document.body.innerHTML = markup.replace('<pre><code>const answer = 42;</code></pre>', ''); const fail = vi.fn().mockRejectedValue(new Error('no'));
    initArticleReader(document, { clipboard: { writeText: fail } }); expect(document.querySelector('[data-article-copy]')).toBeNull();
    document.body.innerHTML = markup; initArticleReader(document, { clipboard: { writeText: fail } }); document.querySelector<HTMLButtonElement>('[data-article-copy]')!.click(); await Promise.resolve();
    expect(document.querySelector('[data-article-copy-status]')?.textContent).toMatch(/无法复制/);
  });
});
