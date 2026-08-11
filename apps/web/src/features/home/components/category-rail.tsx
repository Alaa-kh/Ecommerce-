import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Category } from '@/shared/types/catalog';
import { ProductImage } from '@/shared/components/ui/product-image';
import { CategoryCardSkeleton } from '@/shared/components/ui/skeleton';
import { StatePanel } from '@/shared/components/ui/state-panel';
import { IconArrowRight, IconPackage } from '@/shared/components/ui/icons';
import styles from './category-rail.module.css';

interface CategoryRailProps {
  categories: Category[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
}

export function CategoryRail({
  categories,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: CategoryRailProps) {
  const { t } = useTranslation();
  const items = categories.slice(0, 7);

  return (
    <section className={styles.section} aria-labelledby="category-rail-heading">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t('home.categoriesEyebrow')}</p>
          <h2 id="category-rail-heading">{t('home.categoriesTitle')}</h2>
          <p className={styles.lede}>{t('home.categoriesBody')}</p>
        </div>
        <Link to="/categories" className={styles.viewAll}>
          {t('home.viewAll')}
          <IconArrowRight />
        </Link>
      </div>

      {isLoading ? (
        <div className={styles.mosaic} aria-busy="true" aria-label={t('states.loading')}>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className={styles.skeletonTile}>
              <CategoryCardSkeleton />
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
          description={t('categories.empty')}
          icon={<IconPackage />}
        />
      ) : null}

      {!isLoading && !isError && items.length > 0 ? (
        <div className={`${styles.mosaic} animStagger`}>
          {items.map((category, index) => (
            <Link
              key={category.id}
              to={`/categories/${category.slug}`}
              className={`${styles.tile} ${index === 0 ? styles.tileFeature : ''}`}
            >
              <div className={styles.media}>
                <ProductImage src={category.imageUrl} alt={category.name} />
              </div>
              <span className={styles.name}>{category.name}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
