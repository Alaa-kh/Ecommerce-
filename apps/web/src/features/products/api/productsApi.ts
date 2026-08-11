import { platziRequest } from '@/shared/services/http/platzi-client';
import type {
  PlatziProductDto,
  Product,
  ProductListQuery,
  ProductListResult,
  ProductSort,
} from '@/shared/types/catalog';
import { mapProduct, mapProducts } from '@/features/products/api/productMapper';
import { paginateItems, sortProducts } from '@/features/products/utils/catalog-query';

export interface PlatziProductParams {
  title?: string;
  price_min?: number;
  price_max?: number;
  categoryId?: number;
  categorySlug?: string;
  limit?: number;
  offset?: number;
}

function needsClientPagination(sort: ProductSort): boolean {
  return sort !== 'relevance';
}

async function fetchRawProducts(params: PlatziProductParams): Promise<PlatziProductDto[]> {
  return platziRequest<PlatziProductDto[]>({
    url: '/products',
    method: 'GET',
    params,
  });
}

export const productsApi = {
  async list(query: ProductListQuery = {}): Promise<ProductListResult> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.max(1, Math.min(48, query.pageSize ?? 12));
    const sort = query.sort ?? 'relevance';

    const filterParams: PlatziProductParams = {
      title: query.title?.trim() || undefined,
      categoryId: query.categoryId,
      categorySlug: query.categorySlug,
      price_min: query.priceMin,
      price_max: query.priceMax,
    };

    if (needsClientPagination(sort)) {
      // Platzi has no sort endpoint — fetch the filtered set, then sort + paginate locally.
      const raw = await fetchRawProducts({
        ...filterParams,
        limit: 50,
        offset: 0,
      });
      const sorted = sortProducts(mapProducts(raw), sort);
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

    const offset = (page - 1) * pageSize;
    const raw = await fetchRawProducts({
      ...filterParams,
      limit: pageSize + 1,
      offset,
    });
    const mapped = mapProducts(raw);
    const hasNext = mapped.length > pageSize;
    const items = hasNext ? mapped.slice(0, pageSize) : mapped;

    return {
      items,
      page,
      pageSize,
      hasNext,
      hasPrev: page > 1,
      total: null,
      paginationMode: 'server',
    };
  },

  async getById(id: number): Promise<Product> {
    const dto = await platziRequest<PlatziProductDto>({
      url: `/products/${id}`,
      method: 'GET',
    });
    return mapProduct(dto);
  },

  async getBySlug(slug: string): Promise<Product> {
    const dto = await platziRequest<PlatziProductDto>({
      url: `/products/slug/${encodeURIComponent(slug)}`,
      method: 'GET',
    });
    return mapProduct(dto);
  },

  async getRelated(id: number): Promise<Product[]> {
    const dto = await platziRequest<PlatziProductDto[]>({
      url: `/products/${id}/related`,
      method: 'GET',
    });
    return mapProducts(dto);
  },

  async searchSuggestions(title: string, limit = 6): Promise<Product[]> {
    const trimmed = title.trim();
    if (!trimmed) return [];
    const raw = await fetchRawProducts({ title: trimmed, limit, offset: 0 });
    return mapProducts(raw);
  },

  /** Broad fetch for client-side matching when title filters miss (e.g. Arabic → weak EN). */
  async listBroad(limit = 50): Promise<Product[]> {
    const raw = await fetchRawProducts({ limit, offset: 0 });
    return mapProducts(raw);
  },
};
