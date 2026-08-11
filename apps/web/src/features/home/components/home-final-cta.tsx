import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconArrowRight, IconSearch } from '@/shared/components/ui/icons';
import styles from './home-final-cta.module.css';

export function HomeFinalCta() {
  const { t } = useTranslation();

  return (
    <section className={`${styles.section} animPanel`} aria-labelledby="final-cta-heading">
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{t('app.name')}</p>
        <h2 id="final-cta-heading">{t('home.finalTitle')}</h2>
        <p>{t('home.finalBody')}</p>
      </div>
      <div className={styles.actions}>
        <Link to="/products" className={styles.primary}>
          {t('actions.shopNow')}
          <IconArrowRight />
        </Link>
        <Link to="/search" className={styles.secondary}>
          <IconSearch />
          {t('nav.search')}
        </Link>
      </div>
    </section>
  );
}
