import { resolveTheme, THEME_STORAGE_KEY, type Theme } from '@/domain/theme';

type ThemeRoot = {
  dataset: Record<string, string | undefined>;
  style: { colorScheme: string };
};

type ThemeStorage = {
  getItem(key: string): string | null;
};

type ThemeMediaQuery = {
  matches: boolean;
};

export interface ThemeInitializationEnvironment {
  root: ThemeRoot;
  storage?: ThemeStorage;
  matchMedia?: (query: string) => ThemeMediaQuery;
}

function savedTheme(storage?: ThemeStorage): string | null {
  try {
    return storage?.getItem(THEME_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function prefersDark(matchMedia?: (query: string) => ThemeMediaQuery): boolean {
  try {
    return matchMedia?.('(prefers-color-scheme: dark)').matches === true;
  } catch {
    return false;
  }
}

export function colorSchemeFor(theme: Theme): 'light' | 'dark' {
  return theme === 'light' ? 'light' : 'dark';
}

export function initializeTheme({ root, storage, matchMedia }: ThemeInitializationEnvironment): Theme {
  const theme = resolveTheme(savedTheme(storage), prefersDark(matchMedia));

  root.dataset.theme = theme;
  root.style.colorScheme = colorSchemeFor(theme);
  return theme;
}

export const themeInitializationScript = `(() => {
  const root = document.documentElement;
  let savedTheme = null;
  let prefersDark = false;
  try { savedTheme = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}); } catch {}
  try { prefersDark = matchMedia('(prefers-color-scheme: dark)').matches; } catch {}
  const theme = savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'cyber'
    ? savedTheme
    : prefersDark ? 'dark' : 'light';
  root.dataset.theme = theme;
  root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
})();`;
