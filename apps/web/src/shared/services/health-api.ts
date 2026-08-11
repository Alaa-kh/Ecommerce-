import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/features/categories/api/categoriesApi';

export interface CatalogHealth {
  status: 'up' | 'down';
  provider: string;
  categoryCount: number;
}

export const catalogHealthApi = {
  async check(): Promise<CatalogHealth> {
    const categories = await categoriesApi.list();
    return {
      status: 'up',
      provider: 'Platzi Fake Store API',
      categoryCount: categories.length,
    };
  },
};

export function useCatalogHealth() {
  return useQuery({
    queryKey: ['catalog-health'],
    queryFn: () => catalogHealthApi.check(),
    retry: 1,
  });
}
