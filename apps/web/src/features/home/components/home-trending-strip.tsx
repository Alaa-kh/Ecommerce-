import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Product } from '@/shared/types/catalog';
import { ProductImage } from '@/shared/components/ui/product-image';
import { ProductCardSkeleton } from '@/shared/components/ui/skeleton';
import { StatePanel } from '@/shared/components/ui/state-panel';
import { IconArrowRight, IconPackage } from '@/shared/components/ui/icons';
import { formatMoney } from '@/shared/utils/money';
import styles from './home-trending-strip.module.css';

interface HomeTrendingStripProps {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
}

export function HomeTrendingStrip({
  products,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: HomeTrendingStripProps) {
  const { t, i18n } = useTranslation();
  const items = products.slice(0, 10);

  return (
    <section className={styles.section} aria-labelledby="trending-heading">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t('home.trendingEyebrow')}</p>
          <h2 id="trending-heading">{t('home.trendingTitle')}</h2>
          <p className={styles.lede}>{t('home.trendingBody')}</p>
        </div>
        <Link to="/products?sort=price_desc" className={styles.viewAll}>
          {t('home.viewAll')}
          <IconArrowRight />
        </Link>
      </div>

      {isLoading ? (
        <div className={styles.rail} aria-busy="true" aria-label={t('states.loading')}>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className={styles.skeletonTile}>
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      ) : null}

      {isError ? (
        <StatePanel
          tone="error"
          title={t('states.error')}
          description={errorMessage}
          actionLabel={t('actions.retry')}
          onAction={onRetry}
        />
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        <StatePanel
          tone="empty"
          title={t('states.empty')}
          description={t('products.empty')}
          icon={<IconPackage />}
        />
      ) : null}

      {!isLoading && !isError && items.length > 0 ? (
        <div className={`${styles.rail} animStagger`}>
          {items.map((product, index) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className={styles.tile}
            >
              <span className={styles.rank}>{String(index + 1).padStart(2, '0')}</span>
              <div className={styles.media}>
                <ProductImage src={product.images[0]} alt={product.title} />
              </div>
              <div className={styles.copy}>
                <span className={styles.category}>{product.category.name}</span>
                <strong>{product.title}</strong>
                <em>{formatMoney(product.price, i18n.language)}</em>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
