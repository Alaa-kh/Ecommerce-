import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '@/features/products/components/product-card';
import { useProductList } from '@/features/products/hooks/use-products';
import { ProductGridSkeleton } from '@/shared/components/ui/skeleton';
import { StatePanel } from '@/shared/components/ui/state-panel';
import { IconArrowRight, IconPackage } from '@/shared/components/ui/icons';
import { toAppError } from '@/shared/types/errors';
import { isQueryAwaitingData } from '@/shared/utils/query-status';
import type { ProductSort } from '@/shared/types/catalog';
import styles from './product-rails.module.css';

type RailTab = 'newest' | 'value';

const TAB_SORT: Record<RailTab, ProductSort> = {
  newest: 'newest',
  value: 'price_asc',
};

const TAB_VIEW_ALL: Record<RailTab, string> = {
  newest: '/products?sort=newest',
  value: '/products?sort=price_asc',
};

export function ProductRails() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<RailTab>('newest');
  const query = useProductList({
    page: 1,
    pageSize: 8,
    sort: TAB_SORT[tab],
  });
  const pending = isQueryAwaitingData(query);

  return (
    <section className={styles.section} aria-labelledby="product-rails-heading">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t('home.railsEyebrow')}</p>
          <h2 id="product-rails-heading">{t('home.railsTitle')}</h2>
          <p className={styles.lede}>{t('home.railsBody')}</p>
        </div>
        <Link to={TAB_VIEW_ALL[tab]} className={styles.viewAll}>
          {t('home.viewAll')}
          <IconArrowRight />
        </Link>
      </div>

      <div className={styles.tabs} role="tablist" aria-label={t('home.railsTitle')}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'newest'}
          className={tab === 'newest' ? styles.tabActive : styles.tab}
          onClick={() => setTab('newest')}
        >
          {t('home.railsNewest')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'value'}
          className={tab === 'value' ? styles.tabActive : styles.tab}
          onClick={() => setTab('value')}
        >
          {t('home.railsValue')}
        </button>
      </div>

      <div key={tab} className={styles.panel} role="tabpanel">
        {pending ? (
          <ProductGridSkeleton
            className={`${styles.grid} animStagger`}
            label={t('states.loading')}
          />
        ) : null}

        {!pending && query.isError ? (
          <StatePanel
            tone="error"
            title={t('states.error')}
            description={toAppError(query.error).message}
            actionLabel={t('actions.retry')}
            onAction={() => void query.refetch()}
          />
        ) : null}

        {!pending && query.isSuccess && query.data.items.length === 0 ? (
          <StatePanel
            tone="empty"
            title={t('states.empty')}
            description={t('products.empty')}
            icon={<IconPackage />}
          />
        ) : null}

        {!pending && query.isSuccess && query.data.items.length > 0 ? (
          <div className={`${styles.grid} animStagger`}>
            {query.data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
