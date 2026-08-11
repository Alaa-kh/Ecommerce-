import { platziRequest } from '@/shared/services/http/platzi-client';
import type { Category, PlatziCategoryDto, PlatziProductDto, Product } from '@/shared/types/catalog';
import { mapCategories, mapCategory, mapProducts } from '@/features/products/api/productMapper';

export const categoriesApi = {
  async list(): Promise<Category[]> {
    const dto = await platziRequest<PlatziCategoryDto[]>({
      url: '/categories',
      method: 'GET',
    });
    return mapCategories(dto);
  },

  async getById(id: number): Promise<Category> {
    const dto = await platziRequest<PlatziCategoryDto>({
      url: `/categories/${id}`,
      method: 'GET',
    });
    return mapCategory(dto);
  },

  async getBySlug(slug: string): Promise<Category> {
    const dto = await platziRequest<PlatziCategoryDto>({
      url: `/categories/slug/${encodeURIComponent(slug)}`,
      method: 'GET',
    });
    return mapCategory(dto);
  },

  async getProducts(categoryId: number): Promise<Product[]> {
    const dto = await platziRequest<PlatziProductDto[]>({
      url: `/categories/${categoryId}/products`,
      method: 'GET',
    });
    return mapProducts(dto);
  },
};
