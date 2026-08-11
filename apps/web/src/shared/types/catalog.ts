export interface PlatziCategoryDto {
  id: number;
  name: string;
  slug: string;
  image: string;
  creationAt?: string;
  updatedAt?: string;
}

export interface PlatziProductDto {
  id: number;
  title: string;
  slug: string;
  price: number;
  description: string;
  images: string[];
  category: PlatziCategoryDto;
  creationAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  description: string;
  images: string[];
  category: Category;
  createdAt: string | null;
  updatedAt: string | null;
}

export type ProductSort =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'title_asc';

export type CatalogViewMode = 'grid' | 'list';

export interface ProductListQuery {
  title?: string;
  categoryId?: number;
  categorySlug?: string;
  priceMin?: number;
  priceMax?: number;
  page?: number;
  pageSize?: number;
  sort?: ProductSort;
}

export interface ProductListResult {
  items: Product[];
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
  /** Present when pagination is computed over a fully fetched filtered set. */
  total: number | null;
  paginationMode: 'server' | 'client';
}
