import { normalizeArticleText } from '@/domain/articles';

type Cleanup = () => void;
type ClipboardAdapter = { writeText(text: string): Promise<void> };
type ReaderOptions = {
  clipboard?: ClipboardAdapter;
  requestFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (id: number) => void;
};

const discoveryCleanups = new WeakMap<ParentNode, Cleanup>();
const readerCleanups = new WeakMap<ParentNode, Cleanup>();

function storage(): Storage | undefined {
  try { return window.localStorage; } catch { return undefined; }
}

function savedView(): 'list' | 'grid' {
  try { return storage()?.getItem('zhou-articles-view') === 'grid' ? 'grid' : 'list'; } catch { return 'list'; }
}

export function initArticleDiscovery(root: ParentNode = document): Cleanup {
  discoveryCleanups.get(root)?.();
  const container = root.querySelector<HTMLElement>('[data-article-discovery]');
  if (!container) return () => {};
  const search = container.querySelector<HTMLInputElement>('[data-article-search]');
  const tags = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-article-tag]'));
  const views = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-article-view]'));
  const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-article-card]'));
  const count = container.querySelector<HTMLElement>('[data-article-result-count]');
  const empty = container.querySelector<HTMLElement>('[data-article-no-results]');
  const reset = container.querySelector<HTMLButtonElement>('[data-article-reset]');
  const selected = new Set<string>();
  let view = savedView();

  const setView = (next: 'list' | 'grid', persist = true) => {
    view = next; container.dataset.view = next;
    for (const button of views) button.setAttribute('aria-pressed', String(button.dataset.articleView === next));
    if (persist) try { storage()?.setItem('zhou-articles-view', next); } catch { /* storage is optional */ }
  };
  const render = () => {
    const tokens = normalizeArticleText(search?.value ?? '').split(' ').filter(Boolean);
    let visible = 0;
    for (const card of cards) {
      const text = normalizeArticleText(card.dataset.articleSearchText ?? '');
      let cardTags = new Set<string>();
      try {
        const encodedTags: unknown = JSON.parse(card.dataset.articleTags ?? '[]');
        if (Array.isArray(encodedTags) && encodedTags.every((tag) => typeof tag === 'string')) cardTags = new Set(encodedTags);
      } catch { /* invalid markup does not match selected tags */ }
      const matches = tokens.every((token) => text.includes(token)) && [...selected].every((tag) => cardTags.has(tag));
      card.hidden = !matches; if (matches) visible += 1;
    }
    if (count) count.textContent = `共 ${visible} 篇文章`;
    if (empty) empty.hidden = visible !== 0;
  };
  const onSearch = () => render();
  const onTagClick = (event: Event) => {
    const button = event.currentTarget as HTMLButtonElement; const tag = button.dataset.articleTag;
    if (!tag) return;
    if (selected.has(tag)) selected.delete(tag); else selected.add(tag);
    button.setAttribute('aria-pressed', String(selected.has(tag))); render();
  };
  const onTagKeydown = (event: KeyboardEvent) => {
    const index = tags.indexOf(event.currentTarget as HTMLButtonElement); if (index < 0) return;
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? tags.length - 1 : event.key === 'ArrowLeft' ? (index - 1 + tags.length) % tags.length : event.key === 'ArrowRight' ? (index + 1) % tags.length : -1;
    if (target >= 0) { event.preventDefault(); tags[target]?.focus(); }
  };
  const onViewClick = (event: Event) => setView((event.currentTarget as HTMLButtonElement).dataset.articleView === 'grid' ? 'grid' : 'list');
  const onReset = () => { if (search) search.value = ''; selected.clear(); for (const tag of tags) tag.setAttribute('aria-pressed', 'false'); render(); search?.focus(); };
  search?.addEventListener('input', onSearch); reset?.addEventListener('click', onReset);
  for (const tag of tags) { tag.addEventListener('click', onTagClick); tag.addEventListener('keydown', onTagKeydown); }
  for (const button of views) button.addEventListener('click', onViewClick);
  setView(view, false); render();
  const cleanup = () => {
    search?.removeEventListener('input', onSearch); reset?.removeEventListener('click', onReset);
    for (const tag of tags) { tag.removeEventListener('click', onTagClick); tag.removeEventListener('keydown', onTagKeydown); }
    for (const button of views) button.removeEventListener('click', onViewClick);
    if (discoveryCleanups.get(root) === cleanup) discoveryCleanups.delete(root);
  };
  discoveryCleanups.set(root, cleanup); return cleanup;
}

export function initArticleReader(root: ParentNode = document, options: ReaderOptions = {}): Cleanup {
  readerCleanups.get(root)?.();
  const reader = root.querySelector<HTMLElement>('[data-article-reader]');
  if (!reader) return () => {};
  const progress = reader.querySelector<HTMLProgressElement>('[data-article-progress]');
  const content = reader.querySelector<HTMLElement>('.article-content');
  const status = reader.querySelector<HTMLElement>('[data-article-copy-status]');
  const requestFrame = options.requestFrame ?? ((callback: FrameRequestCallback) => window.requestAnimationFrame(callback));
  const cancelFrame = options.cancelFrame ?? ((id: number) => window.cancelAnimationFrame(id));
  let frame: number | undefined;
  const update = () => {
    frame = undefined;
    if (!progress) return;
    const rect = (content ?? reader).getBoundingClientRect(); const total = rect.height - window.innerHeight;
    progress.value = total <= 0 ? 100 : Math.min(100, Math.max(0, (-rect.top / total) * 100));
  };
  const schedule = () => { if (frame === undefined) frame = requestFrame(update); };
  const generated: HTMLButtonElement[] = [];
  const copy = async (code: HTMLElement) => {
    try {
      const adapter = options.clipboard ?? navigator.clipboard;
      if (!adapter) throw new Error('Clipboard unavailable');
      await adapter.writeText(code.textContent ?? ''); if (status) status.textContent = '代码已复制。';
    } catch { if (status) status.textContent = '无法复制代码。'; }
  };
  const handlers = new Map<HTMLButtonElement, () => void>();
  for (const code of Array.from(reader.querySelectorAll<HTMLElement>('.article-content pre > code'))) {
    const button = code.ownerDocument.createElement('button'); button.type = 'button'; button.dataset.articleCopy = ''; button.textContent = '复制代码';
    const handler = () => { void copy(code); }; button.addEventListener('click', handler); code.parentElement?.append(button); generated.push(button); handlers.set(button, handler);
  }
  window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule); schedule();
  const cleanup = () => {
    window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); if (frame !== undefined) cancelFrame(frame);
    for (const button of generated) { const handler = handlers.get(button); if (handler) button.removeEventListener('click', handler); button.remove(); }
    if (readerCleanups.get(root) === cleanup) readerCleanups.delete(root);
  };
  readerCleanups.set(root, cleanup); return cleanup;
}
