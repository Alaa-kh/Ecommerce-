import type { ThemeMode } from '@/app/config/design-tokens';

export type ResolvedTheme = 'light' | 'dark';

export function getSystemTheme(): ResolvedTheme {
  if (typeof globalThis.matchMedia !== 'function') return 'light';
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function resolveTheme(theme: ThemeMode): ResolvedTheme {
  if (theme === 'system') return getSystemTheme();
  return theme;
}

/** Flip the visible theme — always persists an explicit light/dark preference. */
export function nextTheme(theme: ThemeMode): ResolvedTheme {
  return resolveTheme(theme) === 'dark' ? 'light' : 'dark';
}
