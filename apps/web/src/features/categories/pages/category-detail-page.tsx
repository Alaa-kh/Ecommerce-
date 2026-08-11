import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useCategory,
  useCategoryProducts,
} from '@/features/categories/hooks/use-categories';
import { ProductCard } from '@/features/products/components/product-card';
import { PaginationControls } from '@/features/products/components/pagination-controls';
import { paginateItems, sortProducts } from '@/features/products/utils/catalog-query';
import { ProductImage } from '@/shared/components/ui/product-image';
import { StatePanel } from '@/shared/components/ui/state-panel';
import { PageLoader, ProductGridSkeleton } from '@/shared/components/ui/skeleton';
import type { ProductSort } from '@/shared/types/catalog';
import { toAppError } from '@/shared/types/errors';
import styles from './category-detail-page.module.css';

const PAGE_SIZE = 12;

export function CategoryDetailPage() {
  const { categorySlug } = useParams();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ProductSort>('relevance');

  const categoryQuery = useCategory(categorySlug);
  const productsQuery = useCategoryProducts(categoryQuery.data?.id);

  const paged = useMemo(() => {
    const items = sortProducts(productsQuery.data ?? [], sort);
    return paginateItems(items, page, PAGE_SIZE);
  }, [productsQuery.data, page, sort]);

  if (categoryQuery.isLoading) {
    return <PageLoader label={t('states.loading')} />;
  }

  if (categoryQuery.isError) {
    return (
      <StatePanel
        title={t('states.error')}
        description={toAppError(categoryQuery.error).message}
        actionLabel={t('actions.retry')}
        onAction={() => void categoryQuery.refetch()}
      />
    );
  }

  if (!categoryQuery.data) {
    return <StatePanel title={t('states.empty')} description={t('categories.notFound')} />;
  }

  return (
    <section className={`${styles.page} animPage`}>
      <header className={styles.header}>
        <div className={styles.hero}>
          <ProductImage
            src={categoryQuery.data.imageUrl}
            alt={categoryQuery.data.name}
            loading="eager"
          />
        </div>
        <div>
          <h1>{categoryQuery.data.name}</h1>
          <p>{t('categories.detailSubtitle')}</p>
        </div>
      </header>

      <label className={styles.sort}>
        <span>{t('catalog.sort')}</span>
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as ProductSort);
            setPage(1);
          }}
        >
          <option value="relevance">{t('catalog.sortOptions.relevance')}</option>
          <option value="price_asc">{t('catalog.sortOptions.price_asc')}</option>
          <option value="price_desc">{t('catalog.sortOptions.price_desc')}</option>
          <option value="newest">{t('catalog.sortOptions.newest')}</option>
          <option value="title_asc">{t('catalog.sortOptions.title_asc')}</option>
        </select>
      </label>

      {productsQuery.isLoading ? (
        <ProductGridSkeleton
          className={`${styles.grid} animStagger`}
          label={t('states.loading')}
        />
      ) : null}

      {!productsQuery.isLoading && productsQuery.isError ? (
        <StatePanel
          title={t('states.error')}
          description={toAppError(productsQuery.error).message}
          actionLabel={t('actions.retry')}
          onAction={() => void productsQuery.refetch()}
        />
      ) : null}

      {!productsQuery.isLoading && productsQuery.isSuccess && paged.total === 0 ? (
        <StatePanel title={t('states.empty')} description={t('categories.productsEmpty')} />
      ) : null}

      {!productsQuery.isLoading && productsQuery.isSuccess && paged.items.length > 0 ? (
        <>
          <p className={styles.note}>{t('catalog.clientPaginationNote')}</p>
          <div key={`category-page-${paged.page}`} className={`${styles.grid} animStagger`}>
            {paged.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <PaginationControls
            page={paged.page}
            pageSize={PAGE_SIZE}
            hasNext={paged.hasNext}
            hasPrev={paged.hasPrev}
            total={paged.total}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </section>
  );
}
