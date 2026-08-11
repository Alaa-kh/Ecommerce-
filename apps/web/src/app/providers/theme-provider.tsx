import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { designTokens, type ThemeMode } from '@/app/config/design-tokens';
import { resolveTheme, type ResolvedTheme } from '@/app/config/theme';
import { useAppSelector } from '@/app/store/hooks';

interface ThemeProviderProps {
  children: ReactNode;
}

function applyThemeVariables(theme: ResolvedTheme): void {
  const root = document.documentElement;
  const colors = designTokens.color[theme];
  const shadows = designTokens.shadow[theme];
  const typography = designTokens.typography;
  const motion = designTokens.motion;
  const layout = designTokens.layout;
  const radius = designTokens.radius;
  const gradient = designTokens.gradient;

  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute(
      'content',
      theme === 'dark' ? colors.background : colors.primary,
    );
  }

  const isArabic = root.lang === 'ar' || root.dataset.locale === 'ar';
  const pairs: Array<[string, string]> = [
    ['--color-background', colors.background],
    ['--color-background-subtle', colors.surfaceSecondary],
    ['--color-surface', colors.surface],
    ['--color-surface-elevated', colors.surface],
    ['--color-surface-secondary', colors.surfaceSecondary],
    ['--color-surface-tertiary', colors.surfaceTertiary],
    ['--color-surface-sunken', colors.surfaceTertiary],
    ['--color-text', colors.text],
    ['--color-text-primary', colors.text],
    ['--color-text-secondary', colors.textSecondary],
    ['--color-text-tertiary', colors.textTertiary],
    ['--color-text-muted', colors.textMuted],
    ['--color-text-subtle', colors.textTertiary],
    ['--color-text-body', colors.textBody],
    ['--color-text-inverse', colors.textInverse],
    ['--color-border', colors.border],
    ['--color-border-strong', colors.borderStrong],
    ['--color-divider', colors.divider],
    ['--color-primary', colors.primary],
    ['--color-primary-hover', colors.primaryHover],
    ['--color-primary-active', colors.primaryActive],
    ['--color-primary-muted', colors.primaryMuted],
    ['--color-primary-contrast', colors.primaryContrast],
    ['--color-accent', colors.accent],
    ['--color-accent-hover', colors.accentHover],
    ['--color-accent-active', colors.accentActive],
    ['--color-accent-muted', colors.accentMuted],
    ['--color-accent-soft', colors.accentMuted],
    ['--color-accent-extra-light', colors.accentExtraLight],
    ['--color-secondary', colors.secondary],
    ['--color-secondary-muted', colors.secondaryMuted],
    ['--color-focus', colors.focus],
    ['--color-ring', colors.ring],
    ['--color-overlay', colors.overlay],
    ['--color-shimmer', colors.shimmer],
    ['--color-success', colors.success],
    ['--color-success-hover', colors.successHover],
    ['--color-success-muted', colors.successMuted],
    ['--color-success-text', colors.successText],
    ['--color-warning', colors.warning],
    ['--color-warning-hover', colors.warningHover],
    ['--color-warning-muted', colors.warningMuted],
    ['--color-warning-text', colors.warningText],
    ['--color-error', colors.error],
    ['--color-error-hover', colors.errorHover],
    ['--color-error-muted', colors.errorMuted],
    ['--color-error-text', colors.errorText],
    ['--color-info', colors.info],
    ['--color-info-hover', colors.infoHover],
    ['--color-info-muted', colors.infoMuted],
    ['--color-info-text', colors.infoText],
    ['--color-discount', colors.discount],
    ['--color-sale-soft', colors.saleSoft],
    ['--color-new-product', colors.newProduct],
    ['--color-new-product-soft', colors.newProductSoft],
    ['--color-in-stock', colors.inStock],
    ['--color-low-stock', colors.lowStock],
    ['--color-out-of-stock', colors.outOfStock],
    ['--color-rating', colors.rating],
    ['--color-price', colors.price],
    ['--color-previous-price', colors.previousPrice],
    ['--color-free-shipping', colors.freeShipping],
    ['--color-link', colors.link],
    ['--color-link-hover', colors.linkHover],
    ['--shadow-sm', shadows.sm],
    ['--shadow-md', shadows.md],
    ['--shadow-lg', shadows.lg],
    ['--shadow-hover', shadows.hover],
    ['--shadow-glow', shadows.glow],
    ['--gradient-brand', gradient.brand],
    ['--gradient-hero', gradient.hero],
    ['--gradient-soft', gradient.soft],
    ['--gradient-dark-premium', gradient.darkPremium],
    [
      '--font-sans',
      isArabic ? typography.fontFamilyArabic : typography.fontFamilySans,
    ],
    ['--font-arabic', typography.fontFamilyArabic],
    [
      '--font-display',
      isArabic ? typography.fontFamilyDisplayArabic : typography.fontFamilyDisplay,
    ],
    ['--font-display-arabic', typography.fontFamilyDisplayArabic],
    ['--font-mono', typography.fontFamilyMono],
    ['--motion-fast', motion.fast],
    ['--motion-normal', motion.normal],
    ['--motion-slow', motion.slow],
    ['--motion-easing', motion.easing],
    ['--motion-easing-emphasized', motion.easingEmphasized],
    ['--layout-max', layout.maxWidth],
    ['--layout-max-wide', layout.maxWidthWide],
    ['--layout-gutter', layout.gutter],
    ['--layout-section-gap', layout.sectionGap],
    ['--header-height', layout.headerHeight],
    ['--radius-sm', radius.sm],
    ['--radius-md', radius.md],
    ['--radius-lg', radius.lg],
    ['--radius-xl', radius.xl],
    ['--radius-2xl', radius['2xl']],
  ];

  for (const [key, value] of pairs) {
    root.style.setProperty(key, value);
  }
}

export function useResolvedTheme(theme: ThemeMode): ResolvedTheme {
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    typeof window === 'undefined' ? 'light' : resolveTheme('system'),
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => {
      const next: ResolvedTheme = media.matches ? 'dark' : 'light';
      setSystemTheme((current) => (current === next ? current : next));
    };
    // Subscribe first; initial sync can wait a tick to avoid cascading render lint.
    media.addEventListener('change', sync);
    const frame = window.requestAnimationFrame(sync);
    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener('change', sync);
    };
  }, []);

  return theme === 'system' ? systemTheme : theme;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useAppSelector((state) => state.app.ui.theme);
  const locale = useAppSelector((state) => state.app.ui.locale);
  const direction = useAppSelector((state) => state.app.ui.direction);
  const { i18n } = useTranslation();
  const resolved = useResolvedTheme(theme);

  useEffect(() => {
    applyThemeVariables(resolved);
  }, [resolved, locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    document.documentElement.dataset.locale = locale;
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, direction, i18n]);

  return children;
}
