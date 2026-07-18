import { afterEach, describe, expect, it, vi } from 'vitest';
import { initPortfolioLightboxes } from '../src/scripts/lightbox';

const gallery = `
  <section data-portfolio-gallery>
    <button type="button" data-lightbox-trigger data-lightbox-index="0" aria-label="查看第一项媒体">打开一</button>
    <button type="button" data-lightbox-trigger data-lightbox-index="1" aria-label="查看第二项媒体">打开二</button>
    <template data-lightbox-items>
      <figure data-lightbox-item data-type="image" data-src="/one.webp" data-alt="第一项" data-caption="第一项说明" data-license="自有"></figure>
      <figure data-lightbox-item data-type="video" data-src="/two.webm" data-poster="/two.webp" data-caption="第二项说明" data-license="CC BY" data-credit="授权方" data-license-url="https://example.com/license" data-evidence-url="https://example.com/evidence"></figure>
    </template>
  </section>`;

function mount(): HTMLElement {
  document.body.innerHTML = gallery;
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  });
  return document.body;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('portfolio lightbox', () => {
  it('opens the selected trigger and loops keyboard navigation with an atomic position status', () => {
    const root = mount();
    const cleanup = initPortfolioLightboxes(root);
    const triggers = root.querySelectorAll<HTMLButtonElement>('[data-lightbox-trigger]');

    triggers[1]?.click();
    const dialog = root.querySelector<HTMLDialogElement>('[data-portfolio-lightbox]');
    expect(dialog?.open).toBe(true);
    expect(dialog?.querySelector('[data-lightbox-caption]')?.textContent).toContain('第二项说明');
    expect(dialog?.querySelector('[data-lightbox-status]')?.textContent).toContain('第 2 项，共 2 项');
    expect(dialog?.querySelector('[data-lightbox-credit]')?.textContent).toContain('授权方');
    expect(dialog?.querySelector<HTMLAnchorElement>('[data-lightbox-license-url]')?.href).toBe(
      'https://example.com/license',
    );
    expect(dialog?.querySelector<HTMLVideoElement>('video')?.preload).toBe('none');
    dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const licenseLink = dialog?.querySelector<HTMLAnchorElement>('[data-lightbox-license-url]');
    const evidenceLink = dialog?.querySelector<HTMLAnchorElement>('[data-lightbox-evidence-url]');
    expect(licenseLink?.hidden).toBe(true);
    expect(evidenceLink?.hidden).toBe(true);
    expect(licenseLink?.hasAttribute('href')).toBe(false);
    expect(evidenceLink?.hasAttribute('href')).toBe(false);
    expect(dialog?.querySelector('[data-lightbox-license-url][href]:not([hidden])')).toBeNull();
    expect(dialog?.querySelector('[data-lightbox-status]')?.textContent).toContain('第 1 项，共 2 项');
    cleanup();
  });

  it('traps focus, pauses video on switching and closing, restores the trigger, and cleans up remounts', () => {
    const root = mount();
    const firstCleanup = initPortfolioLightboxes(root);
    const trigger = root.querySelector<HTMLButtonElement>('[data-lightbox-trigger]');
    trigger?.focus();
    trigger?.click();
    const dialog = root.querySelector<HTMLDialogElement>('[data-portfolio-lightbox]');
    const close = dialog?.querySelector<HTMLButtonElement>('[data-lightbox-close]');
    const pause = vi.mocked(HTMLMediaElement.prototype.pause);

    dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const next = dialog?.querySelector<HTMLButtonElement>('[data-lightbox-next]');
    next?.focus();
    dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(dialog?.querySelector('video'));
    close?.click();
    expect(pause).toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger);
    firstCleanup();
    expect(dialog?.open).toBe(false);

    const secondCleanup = initPortfolioLightboxes(root);
    trigger?.click();
    expect(root.querySelector<HTMLDialogElement>('[data-portfolio-lightbox]')?.open).toBe(true);
    secondCleanup();
  });

  it('keeps the newest remount registered when a stale cleanup runs', () => {
    const root = mount();
    const firstCleanup = initPortfolioLightboxes(root);
    const secondCleanup = initPortfolioLightboxes(root);
    firstCleanup();
    const thirdCleanup = initPortfolioLightboxes(root);

    expect(root.querySelectorAll('[data-portfolio-lightbox]')).toHaveLength(1);
    thirdCleanup();
    expect(root.querySelectorAll('[data-portfolio-lightbox]')).toHaveLength(0);
    secondCleanup();
  });

  it('is a no-op when the root has no gallery', () => {
    const root = document.createElement('div');
    expect(() => initPortfolioLightboxes(root)()).not.toThrow();
  });
});
