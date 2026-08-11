import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProductImage } from '@/shared/components/ui/product-image';
import { IconArrowRight } from '@/shared/components/ui/icons';
import {
  clearRecentlyViewed,
  readRecentlyViewed,
  type RecentlyViewedItem,
} from '@/shared/utils/recently-viewed';
import { formatMoney } from '@/shared/utils/money';
import styles from './home-recently-viewed.module.css';

export function HomeRecentlyViewed() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<RecentlyViewedItem[]>(() =>
    readRecentlyViewed().slice(0, 8),
  );

  if (items.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="recent-heading">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t('home.recentEyebrow')}</p>
          <h2 id="recent-heading">{t('home.recentTitle')}</h2>
          <p className={styles.lede}>{t('home.recentBody')}</p>
        </div>
        <button
          type="button"
          className={styles.clear}
          onClick={() => {
            clearRecentlyViewed();
            setItems([]);
          }}
        >
          {t('home.recentClear')}
        </button>
      </div>

      <div className={`${styles.rail} animStagger`}>
        {items.map((item) => (
          <Link
            key={item.productId}
            to={`/products/${item.productId}`}
            className={styles.tile}
          >
            <div className={styles.media}>
              <ProductImage src={item.imageUrl} alt={item.title} />
            </div>
            <strong>{item.title}</strong>
            <em>{formatMoney(item.price, i18n.language)}</em>
          </Link>
        ))}
      </div>

      <Link to="/products" className={styles.more}>
        {t('home.viewAll')}
        <IconArrowRight />
      </Link>
    </section>
  );
}
