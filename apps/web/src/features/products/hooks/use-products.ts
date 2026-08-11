import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/features/products/api/productsApi';
import {
  localizeProduct,
  localizeProducts,
  productMatchesSearchQuery,
  resolveEnglishSearchTerms,
} from '@/shared/services/localization/catalog-i18n';
import type { Product, ProductListQuery, ProductListResult } from '@/shared/types/catalog';
import { useAppSelector } from '@/app/store/hooks';
import { paginateItems, sortProducts } from '@/features/products/utils/catalog-query';

export const productKeys = {
  all: ['products'] as const,
  list: (query: ProductListQuery, locale: string) =>
    [...productKeys.all, 'list', locale, query] as const,
  detail: (idOrSlug: string | number, locale: string) =>
    [...productKeys.all, 'detail', locale, idOrSlug] as const,
  related: (id: number, locale: string) =>
    [...productKeys.all, 'related', locale, id] as const,
  suggestions: (term: string, locale: string) =>
    [...productKeys.all, 'suggestions', locale, term] as const,
};

function mergeUniqueProducts(groups: Product[][]): Product[] {
  const map = new Map<number, Product>();
  for (const group of groups) {
    for (const item of group) {
      map.set(item.id, item);
    }
  }
  return [...map.values()];
}

function emptySearchResult(pageSize: number): ProductListResult {
  return {
    items: [],
    page: 1,
    pageSize,
    hasNext: false,
    hasPrev: false,
    total: 0,
    paginationMode: 'client',
  };
}

async function searchCatalog(query: ProductListQuery): Promise<ProductListResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, Math.min(48, query.pageSize ?? 12));
  const sort = query.sort ?? 'relevance';
  const rawTitle = query.title?.trim();

  if (!rawTitle) {
    return productsApi.list(query);
  }

  const englishTerms = await resolveEnglishSearchTerms(rawTitle);

  // No usable English terms (unknown Arabic / stop-words only) → empty, not random catalog.
  if (englishTerms.length === 0) {
    return emptySearchResult(pageSize);
  }

  const matchesQuery = (product: Product) =>
    productMatchesSearchQuery(product, rawTitle, englishTerms);

  // 1) Try Platzi title filter with each resolved English term, then strict client filter.
  const apiHits: Product[][] = [];
  for (const term of englishTerms.slice(0, 3)) {
    const result = await productsApi.list({
      ...query,
      title: term,
      page: 1,
      pageSize: Math.max(pageSize, 24),
      sort: 'relevance',
    });
    if (result.items.length > 0) {
      apiHits.push(result.items.filter(matchesQuery));
    }
  }

  let merged = mergeUniqueProducts(apiHits);

  // 2) Fallback only when API title filter missed — still strict client match.
  if (merged.length === 0) {
    const broad = await productsApi.listBroad(50);
    merged = broad.filter(matchesQuery);
  }

  if (merged.length === 0) {
    return emptySearchResult(pageSize);
  }

  const sorted = sort === 'relevance' ? merged : sortProducts(merged, sort);
  const paged = paginateItems(sorted, page, pageSize);

  return {
    items: paged.items,
    page: paged.page,
    pageSize,
    hasNext: paged.hasNext,
    hasPrev: paged.hasPrev,
    total: paged.total,
    paginationMode: 'client',
  };
}

export function useProductList(query: ProductListQuery) {
  const locale = useAppSelector((state) => state.app.ui.locale);
  return useQuery({
    queryKey: productKeys.list(query, locale),
    queryFn: async (): Promise<ProductListResult> => {
      const hasTitle = Boolean(query.title?.trim());
      const result = hasTitle ? await searchCatalog(query) : await productsApi.list(query);
      return {
        ...result,
        items: await localizeProducts(result.items, locale),
      };
    },
    placeholderData: (previous) => previous,
  });
}

export function useProductDetail(idOrSlug: string | undefined) {
  const locale = useAppSelector((state) => state.app.ui.locale);
  return useQuery({
    queryKey: productKeys.detail(idOrSlug ?? '', locale),
    enabled: Boolean(idOrSlug),
    queryFn: async () => {
      if (!idOrSlug) {
        throw new Error('Missing product id');
      }
      const product = /^\d+$/.test(idOrSlug)
        ? await productsApi.getById(Number(idOrSlug))
        : await productsApi.getBySlug(idOrSlug);
      return localizeProduct(product, locale);
    },
  });
}

export function useRelatedProducts(productId: number | undefined) {
  const locale = useAppSelector((state) => state.app.ui.locale);
  return useQuery({
    queryKey: productKeys.related(productId ?? 0, locale),
    enabled: typeof productId === 'number' && productId > 0,
    queryFn: async () => {
      const items = await productsApi.getRelated(productId as number);
      return localizeProducts(items, locale);
    },
  });
}

export function useProductSuggestions(term: string) {
  const locale = useAppSelector((state) => state.app.ui.locale);
  const trimmed = term.trim();
  return useQuery({
    queryKey: productKeys.suggestions(trimmed, locale),
    enabled: trimmed.length >= 2,
    queryFn: async () => {
      const englishTerms = await resolveEnglishSearchTerms(trimmed);
      if (englishTerms.length === 0) return [];

      const matchesQuery = (product: Product) =>
        productMatchesSearchQuery(product, trimmed, englishTerms);

      const groups: Product[][] = [];
      for (const apiTerm of englishTerms.slice(0, 3)) {
        const items = await productsApi.searchSuggestions(apiTerm, 8);
        if (items.length > 0) groups.push(items.filter(matchesQuery));
      }

      let merged = mergeUniqueProducts(groups);

      if (merged.length === 0) {
        const broad = await productsApi.listBroad(40);
        merged = broad.filter(matchesQuery);
      }

      return localizeProducts(merged.slice(0, 6), locale);
    },
  });
}
