import { isTheme, THEME_STORAGE_KEY, type Theme } from '@/domain/theme';
import { colorSchemeFor } from '@/scripts/theme-init';

type ThemeStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

type Cleanup = () => void;

const themeControlCleanups = new WeakMap<ParentNode, Cleanup>();

function savedTheme(storage?: ThemeStorage): Theme | undefined {
  try {
    const value = storage?.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function browserStorage(): ThemeStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function persistTheme(storage: ThemeStorage | undefined, theme: Theme) {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be disabled in private browsing or by browser policy.
  }
}

function syncPressedState(root: ParentNode, theme: Theme) {
  root.querySelectorAll<HTMLButtonElement>('[data-theme-button]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.themeButton === theme));
  });
}

export function setTheme(root: HTMLElement, controlsRoot: ParentNode, theme: Theme, storage?: ThemeStorage) {
  root.dataset.theme = theme;
  root.style.colorScheme = colorSchemeFor(theme);
  persistTheme(storage, theme);
  syncPressedState(controlsRoot, theme);
}

export function initThemeControls(controlsRoot: ParentNode = document, storage?: ThemeStorage): Cleanup {
  themeControlCleanups.get(controlsRoot)?.();

  const root = document.documentElement;
  const activeStorage = storage ?? browserStorage();
  const initialTheme = isTheme(root.dataset.theme) ? root.dataset.theme : (savedTheme(activeStorage) ?? 'light');

  root.dataset.theme = initialTheme;
  root.style.colorScheme = colorSchemeFor(initialTheme);
  syncPressedState(controlsRoot, initialTheme);

  const buttons = Array.from(controlsRoot.querySelectorAll<HTMLButtonElement>('[data-theme-button]'));
  const onThemeClick = (event: Event) => {
    const button = event.currentTarget;
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const theme = button.dataset.themeButton;
    if (isTheme(theme)) {
      setTheme(root, controlsRoot, theme, activeStorage);
    }
  };

  buttons.forEach((button) => button.addEventListener('click', onThemeClick));

  const cleanup = () => {
    buttons.forEach((button) => button.removeEventListener('click', onThemeClick));
    if (themeControlCleanups.get(controlsRoot) === cleanup) {
      themeControlCleanups.delete(controlsRoot);
    }
  };

  themeControlCleanups.set(controlsRoot, cleanup);
  return cleanup;
}
