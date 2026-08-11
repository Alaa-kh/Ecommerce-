import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconArrowRight } from '@/shared/components/ui/icons';
import styles from './home-promo-band.module.css';

export function HomePromoBand() {
  const { t } = useTranslation();

  return (
    <section className={styles.band} aria-labelledby="promo-band-heading">
      <div className={styles.media} aria-hidden="true" />
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{t('home.promoEyebrow')}</p>
        <h2 id="promo-band-heading">{t('home.promoTitle')}</h2>
        <p>{t('home.promoBody')}</p>
        <div className={styles.actions}>
          <Link to="/products?sort=price_asc" className={styles.primary}>
            {t('home.promoCta')}
            <IconArrowRight />
          </Link>
          <Link to="/categories" className={styles.secondary}>
            {t('nav.categories')}
          </Link>
        </div>
      </div>
    </section>
  );
}
