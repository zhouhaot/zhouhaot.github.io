export const THEME_STORAGE_KEY = 'zhou-theme';

export const THEME_VALUES = ['light', 'dark', 'cyber'] as const;

export type Theme = (typeof THEME_VALUES)[number];

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && THEME_VALUES.includes(value as Theme);
}

export function resolveTheme(savedTheme: unknown, prefersDark: boolean): Theme {
  if (isTheme(savedTheme)) {
    return savedTheme;
  }

  return prefersDark ? 'dark' : 'light';
}
