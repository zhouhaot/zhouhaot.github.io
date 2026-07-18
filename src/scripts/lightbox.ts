type GalleryItem = {
  type: 'image' | 'video';
  src: string;
  poster?: string;
  alt: string;
  caption: string;
  license: string;
  credit?: string;
  licenseUrl?: string;
  evidenceUrl?: string;
};

const mountedLightboxes = new WeakMap<HTMLElement, () => void>();

function galleryItems(gallery: HTMLElement): GalleryItem[] {
  const template = gallery.querySelector<HTMLTemplateElement>('[data-lightbox-items]');
  if (!template) return [];

  return Array.from(template.content.querySelectorAll<HTMLElement>('[data-lightbox-item]')).flatMap((element) => {
    const type = element.dataset.type;
    const src = element.dataset.src;
    const caption = element.dataset.caption;
    const license = element.dataset.license;
    if ((type !== 'image' && type !== 'video') || !src || !caption || !license) return [];
    return [
      {
        type,
        src,
        alt: element.dataset.alt ?? '',
        caption,
        license,
        ...(element.dataset.poster ? { poster: element.dataset.poster } : {}),
        ...(element.dataset.credit ? { credit: element.dataset.credit } : {}),
        ...(element.dataset.licenseUrl ? { licenseUrl: element.dataset.licenseUrl } : {}),
        ...(element.dataset.evidenceUrl ? { evidenceUrl: element.dataset.evidenceUrl } : {}),
      },
    ];
  });
}

function createButton(document: Document, label: string, attribute: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.setAttribute(attribute, '');
  return button;
}

export function initPortfolioLightboxes(root: HTMLElement): () => void {
  mountedLightboxes.get(root)?.();

  const gallery = root.querySelector<HTMLElement>('[data-portfolio-gallery]');
  const items = gallery ? galleryItems(gallery) : [];
  if (!gallery || !items.length) return () => undefined;

  const document = root.ownerDocument;
  const dialog = document.createElement('dialog');
  dialog.dataset.portfolioLightbox = '';
  dialog.setAttribute('aria-label', '作品媒体预览');
  const closeButton = createButton(document, '关闭', 'data-lightbox-close');
  const previousButton = createButton(document, '上一项', 'data-lightbox-previous');
  const nextButton = createButton(document, '下一项', 'data-lightbox-next');
  const media = document.createElement('div');
  media.dataset.lightboxMedia = '';
  const caption = document.createElement('p');
  caption.dataset.lightboxCaption = '';
  const license = document.createElement('p');
  license.dataset.lightboxLicense = '';
  const credit = document.createElement('p');
  credit.dataset.lightboxCredit = '';
  const licenseLink = document.createElement('a');
  licenseLink.dataset.lightboxLicenseUrl = '';
  licenseLink.textContent = '许可说明';
  licenseLink.rel = 'external noopener noreferrer';
  licenseLink.target = '_blank';
  const evidenceLink = document.createElement('a');
  evidenceLink.dataset.lightboxEvidenceUrl = '';
  evidenceLink.textContent = '来源说明';
  evidenceLink.rel = 'external noopener noreferrer';
  evidenceLink.target = '_blank';
  const status = document.createElement('p');
  status.dataset.lightboxStatus = '';
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');

  dialog.append(
    closeButton,
    previousButton,
    nextButton,
    media,
    caption,
    license,
    credit,
    licenseLink,
    evidenceLink,
    status,
  );
  root.append(dialog);

  const triggers = Array.from(gallery.querySelectorAll<HTMLButtonElement>('[data-lightbox-trigger]'));
  let currentIndex = 0;
  let lastTrigger: HTMLButtonElement | undefined;

  const pauseVideo = () => {
    media.querySelector<HTMLVideoElement>('video')?.pause();
  };

  const render = (index: number) => {
    pauseVideo();
    currentIndex = (index + items.length) % items.length;
    const item = items[currentIndex];
    if (!item) return;
    if (item.type === 'image') {
      const image = document.createElement('img');
      image.src = item.src;
      image.alt = item.alt;
      image.loading = 'eager';
      media.replaceChildren(image);
    } else {
      const video = document.createElement('video');
      video.src = item.src;
      video.controls = true;
      video.preload = 'none';
      video.poster = item.poster ?? '';
      video.tabIndex = 0;
      media.replaceChildren(video);
    }
    caption.textContent = item.caption;
    license.textContent = item.license;
    credit.textContent = item.credit ?? '';
    licenseLink.hidden = !item.licenseUrl;
    evidenceLink.hidden = !item.evidenceUrl;
    if (item.licenseUrl) licenseLink.href = item.licenseUrl;
    if (item.evidenceUrl) evidenceLink.href = item.evidenceUrl;
    status.textContent = `第 ${currentIndex + 1} 项，共 ${items.length} 项`;
  };

  const close = () => {
    pauseVideo();
    if (dialog.open) dialog.close();
  };

  const onTrigger = (event: Event) => {
    const trigger = event.currentTarget as HTMLButtonElement;
    const index = Number(trigger.dataset.lightboxIndex);
    if (!Number.isInteger(index) || index < 0 || index >= items.length) return;
    lastTrigger = trigger;
    render(index);
    dialog.showModal();
    closeButton.focus();
  };
  const onPrevious = () => render(currentIndex - 1);
  const onNext = () => render(currentIndex + 1);
  const onClose = () => {
    pauseVideo();
    lastTrigger?.focus();
  };
  const onCancel = (event: Event) => {
    event.preventDefault();
    close();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onPrevious();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onNext();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
    if (event.key !== 'Tab') return;
    const controls = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href]:not([hidden]), video[controls], [tabindex]:not([tabindex="-1"])',
      ),
    );
    const activeIndex = controls.indexOf(document.activeElement as HTMLElement);
    const nextIndex = event.shiftKey ? activeIndex - 1 : activeIndex + 1;
    const target = controls[(nextIndex + controls.length) % controls.length] ?? closeButton;
    event.preventDefault();
    target.focus();
  };

  triggers.forEach((trigger) => trigger.addEventListener('click', onTrigger));
  previousButton.addEventListener('click', onPrevious);
  nextButton.addEventListener('click', onNext);
  closeButton.addEventListener('click', close);
  dialog.addEventListener('close', onClose);
  dialog.addEventListener('cancel', onCancel);
  dialog.addEventListener('keydown', onKeyDown);

  const cleanup = () => {
    triggers.forEach((trigger) => trigger.removeEventListener('click', onTrigger));
    previousButton.removeEventListener('click', onPrevious);
    nextButton.removeEventListener('click', onNext);
    closeButton.removeEventListener('click', close);
    dialog.removeEventListener('close', onClose);
    dialog.removeEventListener('cancel', onCancel);
    dialog.removeEventListener('keydown', onKeyDown);
    pauseVideo();
    if (dialog.open) dialog.close();
    dialog.remove();
    if (mountedLightboxes.get(root) === cleanup) mountedLightboxes.delete(root);
  };

  mountedLightboxes.set(root, cleanup);
  return cleanup;
}
