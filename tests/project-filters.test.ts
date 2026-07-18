import { afterEach, describe, expect, it } from 'vitest';
import { initProjectFilters } from '../src/scripts/project-filters';

const markup = `
  <section data-project-filters>
    <div role="group" aria-label="项目类型">
      <button type="button" data-project-type="all" aria-pressed="true">全部</button>
      <button type="button" data-project-type="work" aria-pressed="false">项目</button>
      <button type="button" data-project-type="lab" aria-pressed="false">实验</button>
    </div>
    <label>状态 <select data-project-status><option value="all">全部</option><option value="validated">已验证</option></select></label>
    <label>年份 <select data-project-year><option value="all">全部</option><option value="2026">2026</option></select></label>
    <button type="button" data-project-reset>重置</button>
    <p data-project-result-count aria-live="polite"></p>
    <p data-project-no-results aria-live="polite" hidden>没有匹配的项目。</p>
    <div>
      <article data-project-card data-project-kind="work" data-project-status="validated" data-project-year="2026">Work</article>
      <article data-project-card data-project-kind="lab" data-project-status="prototype" data-project-year="2025">Lab</article>
    </div>
  </section>`;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('project filters', () => {
  it('combines type, status, and year filters with AND semantics and announces results', () => {
    document.body.innerHTML = markup;
    initProjectFilters();

    document.querySelector<HTMLButtonElement>('[data-project-type="work"]')?.click();
    document.querySelector<HTMLSelectElement>('[data-project-status]')!.value = 'validated';
    document.querySelector<HTMLSelectElement>('[data-project-status]')!.dispatchEvent(new Event('change'));
    document.querySelector<HTMLSelectElement>('[data-project-year]')!.value = '2026';
    document.querySelector<HTMLSelectElement>('[data-project-year]')!.dispatchEvent(new Event('change'));

    expect(document.querySelector<HTMLElement>('[data-project-card][data-project-kind="work"]')?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('[data-project-card][data-project-kind="lab"]')?.hidden).toBe(true);
    expect(document.querySelector('[data-project-result-count]')?.textContent).toContain('1');
  });

  it('supports arrow, home, and end navigation while maintaining one pressed type button', () => {
    document.body.innerHTML = markup;
    initProjectFilters();
    const all = document.querySelector<HTMLButtonElement>('[data-project-type="all"]')!;

    all.focus();
    all.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(document.querySelector('[data-project-type="lab"]'));
    expect(document.querySelector('[data-project-type="lab"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelectorAll('[data-project-type][aria-pressed="true"]')).toHaveLength(1);

    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(all);
    expect(all.getAttribute('aria-pressed')).toBe('true');
  });

  it('resets all filters and stays cleanup/remount safe', () => {
    document.body.innerHTML = markup;
    initProjectFilters();
    const cleanup = initProjectFilters();
    document.querySelector<HTMLButtonElement>('[data-project-type="lab"]')?.click();
    document.querySelector<HTMLButtonElement>('[data-project-reset]')?.click();

    expect(document.querySelectorAll<HTMLElement>('[data-project-card][hidden]')).toHaveLength(0);
    expect(document.querySelector('[data-project-type="all"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector<HTMLSelectElement>('[data-project-status]')?.value).toBe('all');
    cleanup();
    document.querySelector<HTMLButtonElement>('[data-project-type="lab"]')?.click();
    expect(document.querySelector('[data-project-type="all"]')?.getAttribute('aria-pressed')).toBe('true');
  });
});
