type NavigationRoot = Document | HTMLElement;

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
  );
}

export function isCurrentNavigationRoute(href: string, currentPath: string): boolean {
  return href === '/' ? currentPath === '/' : currentPath === href || currentPath.startsWith(href);
}

export function initNavigation(root: NavigationRoot = document) {
  const trigger = root.querySelector<HTMLButtonElement>('[data-menu-trigger]');
  const drawer = root.querySelector<HTMLElement>('[data-mobile-drawer]');
  const overlay = root.querySelector<HTMLElement>('[data-drawer-overlay]');
  const closeButton = root.querySelector<HTMLButtonElement>('[data-drawer-close]');

  if (!trigger || !drawer || !overlay || !closeButton) {
    return;
  }

  let isOpen = false;

  const setOpen = (open: boolean, restoreFocus = true) => {
    isOpen = open;
    trigger.setAttribute('aria-expanded', String(open));
    drawer.setAttribute('aria-hidden', String(!open));
    drawer.toggleAttribute('inert', !open);
    overlay.hidden = !open;
    overlay.classList.toggle('is-visible', open);
    drawer.classList.toggle('is-open', open);

    if (open) {
      closeButton.focus();
    } else if (restoreFocus) {
      trigger.focus();
    }
  };

  const close = (restoreFocus = true) => setOpen(false, restoreFocus);

  trigger.addEventListener('click', () => setOpen(!isOpen));
  closeButton.addEventListener('click', () => close());
  overlay.addEventListener('click', () => close());
  drawer.querySelectorAll<HTMLAnchorElement>('[data-drawer-link]').forEach((link) => {
    link.addEventListener('click', () => close(false));
  });

  root.addEventListener('keydown', (event) => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    if (!isOpen) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const elements = focusableElements(drawer);
    const first = elements[0];
    const last = elements.at(-1);

    if (!first || !last) {
      event.preventDefault();
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  setOpen(false, false);
}
