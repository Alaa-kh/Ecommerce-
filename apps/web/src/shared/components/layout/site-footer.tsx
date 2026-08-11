import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLogo } from '@/shared/components/ui/brand-logo';
import styles from './site-footer.module.css';

export function SiteFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <BrandLogo
            size="lg"
            withWordmark
            wordmark={t('app.name')}
            tagline={t('app.tagline')}
          />
        </div>
        <nav className={styles.links} aria-label={t('footer.navLabel')}>
          <Link to="/products">{t('nav.products')}</Link>
          <Link to="/categories">{t('nav.categories')}</Link>
          <Link to="/search">{t('nav.search')}</Link>
          <Link to="/account">{t('nav.account')}</Link>
        </nav>
        <p className={styles.copy}>
          © {year} {t('app.name')}. {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}
