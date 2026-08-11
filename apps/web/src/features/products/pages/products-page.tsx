import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { ProductCard } from '@/features/products/components/product-card';
import { PaginationControls } from '@/features/products/components/pagination-controls';
import {
  ProductToolbar,
  type ProductToolbarValues,
} from '@/features/products/components/product-toolbar';
import { useProductList } from '@/features/products/hooks/use-products';
import { StatePanel } from '@/shared/components/ui/state-panel';
import { ProductGridSkeleton } from '@/shared/components/ui/skeleton';
import { IconPackage } from '@/shared/components/ui/icons';
import type { CatalogViewMode, ProductListQuery, ProductSort } from '@/shared/types/catalog';
import { toAppError } from '@/shared/types/errors';
import { isQueryAwaitingData } from '@/shared/utils/query-status';
import styles from './products-page.module.css';

function parseSort(value: string | null): ProductSort {
  const allowed: ProductSort[] = [
    'relevance',
    'price_asc',
    'price_desc',
    'newest',
    'title_asc',
  ];
  return allowed.includes(value as ProductSort) ? (value as ProductSort) : 'relevance';
}

function parseView(value: string | null): CatalogViewMode {
  return value === 'list' ? 'list' : 'grid';
}

function valuesFromParams(params: URLSearchParams): ProductToolbarValues {
  return {
    title: params.get('q') ?? '',
    categoryId: params.get('categoryId') ?? '',
    priceMin: params.get('priceMin') ?? '',
    priceMax: params.get('priceMax') ?? '',
    sort: parseSort(params.get('sort')),
    pageSize: Number(params.get('pageSize') ?? 12) || 12,
    view: parseView(params.get('view')),
  };
}

export function ProductsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const categoriesQuery = useCategories();
  const urlKey = params.toString();
  const urlValues = useMemo(() => valuesFromParams(params), [params]);
  const [draft, setDraft] = useState<ProductToolbarValues>(urlValues);
  const [syncedUrlKey, setSyncedUrlKey] = useState(urlKey);

  if (urlKey !== syncedUrlKey) {
    setSyncedUrlKey(urlKey);
    setDraft(urlValues);
  }

  const query: ProductListQuery = {
    title: params.get('q') ?? undefined,
    categoryId: params.get('categoryId') ? Number(params.get('categoryId')) : undefined,
    priceMin: params.get('priceMin') ? Number(params.get('priceMin')) : undefined,
    priceMax: params.get('priceMax') ? Number(params.get('priceMax')) : undefined,
    sort: parseSort(params.get('sort')),
    page: Number(params.get('page') ?? 1) || 1,
    pageSize: Number(params.get('pageSize') ?? 12) || 12,
  };

  const productsQuery = useProductList(query);
  const view = parseView(params.get('view'));
  const productsPending = isQueryAwaitingData(productsQuery);

  function commitFilters(next: ProductToolbarValues, page = 1) {
    const nextParams = new URLSearchParams();
    if (next.title.trim()) nextParams.set('q', next.title.trim());
    if (next.categoryId) nextParams.set('categoryId', next.categoryId);
    if (next.priceMin) nextParams.set('priceMin', next.priceMin);
    if (next.priceMax) nextParams.set('priceMax', next.priceMax);
    if (next.sort !== 'relevance') nextParams.set('sort', next.sort);
    if (next.pageSize !== 12) nextParams.set('pageSize', String(next.pageSize));
    if (next.view !== 'grid') nextParams.set('view', next.view);
    if (page > 1) nextParams.set('page', String(page));
    setParams(nextParams);
  }

  return (
    <section className={`${styles.page} animPage`}>
      <header className={styles.header}>
        <h1>{t('products.title')}</h1>
        <p>{t('products.subtitle')}</p>
      </header>

      <div className={styles.layout}>
        <ProductToolbar
          values={draft}
          categories={categoriesQuery.data ?? []}
          onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          onSubmit={() => commitFilters(draft, 1)}
          onReset={() => {
            const reset: ProductToolbarValues = {
              title: '',
              categoryId: '',
              priceMin: '',
              priceMax: '',
              sort: 'relevance',
              pageSize: 12,
              view: 'grid',
            };
            setDraft(reset);
            commitFilters(reset, 1);
          }}
        />

        <div className={styles.results}>
          {productsPending ? (
            <ProductGridSkeleton
              className={`${view === 'list' ? styles.list : styles.grid} animStagger`}
              label={t('states.loading')}
            />
          ) : null}

          {!productsPending && productsQuery.isError ? (
            <StatePanel
              tone="error"
              title={t('states.error')}
              description={toAppError(productsQuery.error).message}
              actionLabel={t('actions.retry')}
              onAction={() => void productsQuery.refetch()}
            />
          ) : null}

          {!productsPending &&
          productsQuery.isSuccess &&
          productsQuery.data.items.length === 0 ? (
            <StatePanel
              tone="empty"
              title={t('states.empty')}
              description={t('products.empty')}
              icon={<IconPackage />}
            />
          ) : null}

          {!productsPending &&
          productsQuery.isSuccess &&
          productsQuery.data.items.length > 0 ? (
            <>
              <p className={styles.meta}>
                {productsQuery.data.paginationMode === 'client'
                  ? t('catalog.clientPaginationNote')
                  : t('catalog.serverPaginationNote')}
              </p>
              <div
                key={`page-${productsQuery.data.page}-${view}`}
                className={`${view === 'list' ? styles.list : styles.grid} animStagger`}
              >
                {productsQuery.data.items.map((product) => (
                  <ProductCard key={product.id} product={product} view={view} />
                ))}
              </div>
              <PaginationControls
                page={productsQuery.data.page}
                pageSize={productsQuery.data.pageSize}
                hasNext={productsQuery.data.hasNext}
                hasPrev={productsQuery.data.hasPrev}
                total={productsQuery.data.total}
                onPageChange={(page) => commitFilters(draft, page)}
              />
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
