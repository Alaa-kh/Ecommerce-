import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { PaginationControls } from '@/features/products/components/pagination-controls';
import { paginateItems } from '@/features/products/utils/catalog-query';
import { ProductImage } from '@/shared/components/ui/product-image';
import { StatePanel } from '@/shared/components/ui/state-panel';
import { CategoryCardSkeleton } from '@/shared/components/ui/skeleton';
import { IconPackage } from '@/shared/components/ui/icons';
import { toAppError } from '@/shared/types/errors';
import styles from './categories-page.module.css';

const PAGE_SIZE = 12;

export function CategoriesPage() {
  const { t } = useTranslation();
  const categoriesQuery = useCategories();
  const [page, setPage] = useState(1);

  const paged = useMemo(
    () => paginateItems(categoriesQuery.data ?? [], page, PAGE_SIZE),
    [categoriesQuery.data, page],
  );

  return (
    <section className={`${styles.page} animPage`}>
      <header className={styles.header}>
        <h1>{t('categories.title')}</h1>
        <p>{t('categories.subtitle')}</p>
      </header>

      {categoriesQuery.isLoading ? (
        <div className={`${styles.grid} animStagger`} aria-busy="true" aria-label={t('states.loading')}>
          {Array.from({ length: 8 }).map((_, index) => (
            <CategoryCardSkeleton key={index} />
          ))}
        </div>
      ) : null}

      {categoriesQuery.isError ? (
        <StatePanel
          tone="error"
          title={t('states.error')}
          description={toAppError(categoriesQuery.error).message}
          actionLabel={t('actions.retry')}
          onAction={() => void categoriesQuery.refetch()}
        />
      ) : null}

      {categoriesQuery.isSuccess && paged.total === 0 ? (
        <StatePanel
          tone="empty"
          title={t('states.empty')}
          description={t('categories.empty')}
          icon={<IconPackage />}
        />
      ) : null}

      {categoriesQuery.isSuccess && paged.items.length > 0 ? (
        <>
          <div key={`categories-page-${paged.page}`} className={`${styles.grid} animStagger`}>
            {paged.items.map((category) => (
              <Link
                key={category.id}
                to={`/categories/${category.slug}`}
                className={styles.card}
              >
                <div className={styles.media}>
                  <ProductImage src={category.imageUrl} alt={category.name} />
                </div>
                <h2>{category.name}</h2>
              </Link>
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
