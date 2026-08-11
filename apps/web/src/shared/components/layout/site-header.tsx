import { type FormEvent, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setLocale, setMobileNavOpen, setTheme } from '@/app/store/app-slice';
import { nextTheme } from '@/app/config/theme';
import { useResolvedTheme } from '@/app/providers/theme-provider';
import { BrandLogo } from '@/shared/components/ui/brand-logo';
import { IconButton } from '@/shared/components/ui/icon-button';
import { SearchField } from '@/shared/components/ui/field';
import {
  IconCart,
  IconClose,
  IconHeart,
  IconMenu,
  IconMoon,
  IconSearch,
  IconSun,
  IconUser,
} from '@/shared/components/ui/icons';
import { selectWishlistCount } from '@/features/wishlist/store/wishlist-slice';
import { selectCartCount } from '@/features/cart/store/cart-slice';
import { useRequireAuth } from '@/features/auth/hooks/use-require-auth';
import styles from './site-header.module.css';

const navItems = [
  { to: '/', key: 'home', end: true },
  { to: '/products', key: 'products' },
  { to: '/categories', key: 'categories' },
  { to: '/search', key: 'search' },
] as const;

export function SiteHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.app.ui.theme);
  const resolvedTheme = useResolvedTheme(theme);
  const locale = useAppSelector((state) => state.app.ui.locale);
  const isMobileNavOpen = useAppSelector((state) => state.app.ui.isMobileNavOpen);
  const isAuthenticated = useAppSelector((state) => state.app.auth.isAuthenticated);
  const wishlistCount = useAppSelector(selectWishlistCount);
  const cartCount = useAppSelector(selectCartCount);
  const { requireAuth } = useRequireAuth();
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function toggleTheme() {
    dispatch(setTheme(nextTheme(theme)));
  }

  function onSearchSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      navigate('/search');
      return;
    }
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    dispatch(setMobileNavOpen(false));
  }

  return (
    <header className={scrolled ? `${styles.header} ${styles.scrolled}` : styles.header}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand} onClick={() => dispatch(setMobileNavOpen(false))}>
          <BrandLogo
            withWordmark
            wordmark={t('app.name')}
            tagline={t('app.tagline')}
          />
        </NavLink>

        <nav className={styles.desktopNav} aria-label={t('nav.primary')}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <form className={styles.search} onSubmit={onSearchSubmit}>
          <SearchField
            label={t('catalog.search')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('catalog.searchPlaceholder')}
            onClear={() => setQuery('')}
            clearLabel={t('actions.clear')}
          />
        </form>

        <div className={styles.actions}>
          <IconButton
            className={styles.desktopOnly}
            label={t('nav.search')}
            onClick={() => navigate('/search')}
          >
            <IconSearch />
          </IconButton>
          <IconButton
            label={t('nav.wishlist')}
            badge={isAuthenticated ? wishlistCount : 0}
            active={isAuthenticated && wishlistCount > 0}
            onClick={() => {
              if (!requireAuth('/wishlist')) return;
              navigate('/wishlist');
            }}
          >
            <IconHeart />
          </IconButton>
          <IconButton
            label={t('nav.cart')}
            badge={isAuthenticated ? cartCount : 0}
            active={isAuthenticated && cartCount > 0}
            onClick={() => {
              if (!requireAuth('/cart')) return;
              navigate('/cart');
            }}
          >
            <IconCart />
          </IconButton>
          <IconButton
            label={isAuthenticated ? t('nav.account') : t('auth.loginCta')}
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login?redirect=/account');
                return;
              }
              navigate('/account');
            }}
          >
            <IconUser />
          </IconButton>
          <IconButton
            label={t('actions.toggleTheme')}
            active={resolvedTheme === 'dark'}
            aria-pressed={resolvedTheme === 'dark'}
            onClick={toggleTheme}
          >
            {resolvedTheme === 'dark' ? <IconMoon /> : <IconSun />}
          </IconButton>
          <IconButton
            label={t('actions.toggleLanguage')}
            onClick={() => dispatch(setLocale(locale === 'en' ? 'ar' : 'en'))}
          >
            <span className={styles.locale}>{locale === 'en' ? 'ع' : 'EN'}</span>
          </IconButton>
          <IconButton
            className={styles.menuButton}
            label={isMobileNavOpen ? t('actions.closeMenu') : t('actions.openMenu')}
            aria-expanded={isMobileNavOpen}
            aria-controls="mobile-nav"
            onClick={() => dispatch(setMobileNavOpen(!isMobileNavOpen))}
          >
            {isMobileNavOpen ? <IconClose /> : <IconMenu />}
          </IconButton>
        </div>
      </div>

      {isMobileNavOpen ? (
        <nav id="mobile-nav" className={styles.mobileNav} aria-label={t('nav.mobile')}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
              onClick={() => dispatch(setMobileNavOpen(false))}
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
          <NavLink
            to="/account"
            className={styles.navLink}
            onClick={() => dispatch(setMobileNavOpen(false))}
          >
            {t('nav.account')}
          </NavLink>
        </nav>
      ) : null}
    </header>
  );
}
