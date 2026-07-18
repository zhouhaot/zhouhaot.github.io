import { isTheme, THEME_STORAGE_KEY, type Theme } from '@/domain/theme';
import { colorSchemeFor } from '@/scripts/theme-init';

type ThemeStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

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

export function initThemeControls(controlsRoot: ParentNode = document, storage?: ThemeStorage) {
  const root = document.documentElement;
  const activeStorage = storage ?? browserStorage();
  const initialTheme = isTheme(root.dataset.theme) ? root.dataset.theme : (savedTheme(activeStorage) ?? 'light');

  root.dataset.theme = initialTheme;
  root.style.colorScheme = colorSchemeFor(initialTheme);
  syncPressedState(controlsRoot, initialTheme);

  controlsRoot.querySelectorAll<HTMLButtonElement>('[data-theme-button]').forEach((button) => {
    button.addEventListener('click', () => {
      const theme = button.dataset.themeButton;
      if (isTheme(theme)) {
        setTheme(root, controlsRoot, theme, activeStorage);
      }
    });
  });
}
