import { describe, expect, it, vi, afterEach } from 'vitest';
import { nextTheme, resolveTheme } from '@/app/config/theme';

describe('theme helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves explicit themes as-is', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('toggles from the resolved appearance so system never no-ops', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: String(query).includes('prefers-color-scheme: dark'),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
        onchange: null,
      })),
    );

    expect(resolveTheme('system')).toBe('dark');
    expect(nextTheme('system')).toBe('light');
    expect(nextTheme('dark')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
  });
});
