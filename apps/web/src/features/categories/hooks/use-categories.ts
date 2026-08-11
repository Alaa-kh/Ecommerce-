import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/features/categories/api/categoriesApi';
import {
  localizeCategories,
  localizeCategory,
  localizeProducts,
} from '@/shared/services/localization/catalog-i18n';
import { useAppSelector } from '@/app/store/hooks';

export const categoryKeys = {
  all: ['categories'] as const,
  list: (locale: string) => [...categoryKeys.all, 'list', locale] as const,
  detail: (idOrSlug: string | number, locale: string) =>
    [...categoryKeys.all, 'detail', locale, idOrSlug] as const,
  products: (id: number, locale: string) =>
    [...categoryKeys.all, 'products', locale, id] as const,
};

export function useCategories() {
  const locale = useAppSelector((state) => state.app.ui.locale);
  return useQuery({
    queryKey: categoryKeys.list(locale),
    queryFn: async () => {
      const categories = await categoriesApi.list();
      return localizeCategories(categories, locale);
    },
  });
}

export function useCategory(idOrSlug: string | undefined) {
  const locale = useAppSelector((state) => state.app.ui.locale);
  return useQuery({
    queryKey: categoryKeys.detail(idOrSlug ?? '', locale),
    enabled: Boolean(idOrSlug),
    queryFn: async () => {
      if (!idOrSlug) throw new Error('Missing category');
      const category = /^\d+$/.test(idOrSlug)
        ? await categoriesApi.getById(Number(idOrSlug))
        : await categoriesApi.getBySlug(idOrSlug);
      return localizeCategory(category, locale);
    },
  });
}

export function useCategoryProducts(categoryId: number | undefined) {
  const locale = useAppSelector((state) => state.app.ui.locale);
  return useQuery({
    queryKey: categoryKeys.products(categoryId ?? 0, locale),
    enabled: typeof categoryId === 'number' && categoryId > 0,
    queryFn: async () => {
      const products = await categoriesApi.getProducts(categoryId as number);
      return localizeProducts(products, locale);
    },
  });
}
