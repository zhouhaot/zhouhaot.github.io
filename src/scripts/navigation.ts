type NavigationRoot = Document | HTMLElement;
type Cleanup = () => void;

const navigationCleanups = new WeakMap<NavigationRoot, Cleanup>();

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

export function initNavigation(root: NavigationRoot = document): Cleanup {
  navigationCleanups.get(root)?.();

  const trigger = root.querySelector<HTMLButtonElement>('[data-menu-trigger]');
  const drawer = root.querySelector<HTMLElement>('[data-mobile-drawer]');
  const overlay = root.querySelector<HTMLElement>('[data-drawer-overlay]');
  const closeButton = root.querySelector<HTMLButtonElement>('[data-drawer-close]');

  if (!trigger || !drawer || !overlay || !closeButton) {
    return () => {};
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

  const onTriggerClick = () => setOpen(!isOpen);
  const onCloseClick = () => close();
  const onOverlayClick = () => close();
  const onDrawerLinkClick = () => close(false);
  const drawerLinks = Array.from(drawer.querySelectorAll<HTMLAnchorElement>('[data-drawer-link]'));

  const onKeydown = (event: Event) => {
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
  };

  trigger.addEventListener('click', onTriggerClick);
  closeButton.addEventListener('click', onCloseClick);
  overlay.addEventListener('click', onOverlayClick);
  drawerLinks.forEach((link) => link.addEventListener('click', onDrawerLinkClick));
  root.addEventListener('keydown', onKeydown);

  const cleanup = () => {
    trigger.removeEventListener('click', onTriggerClick);
    closeButton.removeEventListener('click', onCloseClick);
    overlay.removeEventListener('click', onOverlayClick);
    drawerLinks.forEach((link) => link.removeEventListener('click', onDrawerLinkClick));
    root.removeEventListener('keydown', onKeydown);
    setOpen(false, false);
    if (navigationCleanups.get(root) === cleanup) {
      navigationCleanups.delete(root);
    }
  };

  setOpen(false, false);
  navigationCleanups.set(root, cleanup);
  return cleanup;
}
