import { useCategories } from '@/features/categories/hooks/use-categories';
import { useProductList } from '@/features/products/hooks/use-products';
import { useCatalogHealth } from '@/shared/services/health-api';
import { toAppError } from '@/shared/types/errors';
import { isQueryAwaitingData } from '@/shared/utils/query-status';
import { CategoryRail } from '@/features/home/components/category-rail';
import { HomeDiscoveryMarquee } from '@/features/home/components/home-discovery-marquee';
import { HomeFinalCta } from '@/features/home/components/home-final-cta';
import { HomeHero } from '@/features/home/components/home-hero';
import { HomePromoBand } from '@/features/home/components/home-promo-band';
import { HomeRecentlyViewed } from '@/features/home/components/home-recently-viewed';
import { HomeTrendingStrip } from '@/features/home/components/home-trending-strip';
import { HomeValueProps } from '@/features/home/components/home-value-props';
import { ProductRails } from '@/features/home/components/product-rails';
import styles from './home-page.module.css';

export function HomePage() {
  const healthQuery = useCatalogHealth();
  const categoriesQuery = useCategories();
  const featuredQuery = useProductList({
    page: 1,
    pageSize: 12,
    sort: 'newest',
  });
  const trendingQuery = useProductList({
    page: 1,
    pageSize: 10,
    sort: 'price_desc',
  });

  const featuredPending = isQueryAwaitingData(featuredQuery);
  const trendingPending = isQueryAwaitingData(trendingQuery);
  const featuredItems = featuredPending ? [] : (featuredQuery.data?.items ?? []);

  return (
    <div className={`${styles.page} animPage`}>
      <HomeHero
        categoryCount={healthQuery.data?.categoryCount ?? null}
        catalogUp={healthQuery.data ? healthQuery.data.status === 'up' : null}
      />

      <HomeDiscoveryMarquee products={featuredItems} />

      <CategoryRail
        categories={categoriesQuery.data ?? []}
        isLoading={categoriesQuery.isLoading}
        isError={categoriesQuery.isError}
        errorMessage={
          categoriesQuery.isError
            ? toAppError(categoriesQuery.error).message
            : undefined
        }
        onRetry={() => void categoriesQuery.refetch()}
      />

      <HomeTrendingStrip
        products={trendingPending ? [] : (trendingQuery.data?.items ?? [])}
        isLoading={trendingPending}
        isError={trendingQuery.isError}
        errorMessage={
          trendingQuery.isError
            ? toAppError(trendingQuery.error).message
            : undefined
        }
        onRetry={() => void trendingQuery.refetch()}
      />

      <HomePromoBand />

      <ProductRails />

      <HomeRecentlyViewed />

      <HomeValueProps />

      <HomeFinalCta />
    </div>
  );
}
