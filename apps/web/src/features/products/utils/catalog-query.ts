import type { Product, ProductSort } from '@/shared/types/catalog';

export function sortProducts(products: Product[], sort: ProductSort): Product[] {
  const copy = [...products];

  switch (sort) {
    case 'price_asc':
      return copy.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return copy.sort((a, b) => b.price - a.price);
    case 'newest':
      return copy.sort((a, b) => {
        const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
        return bTime - aTime;
      });
    case 'title_asc':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'relevance':
    default:
      return copy;
  }
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; total: number; hasNext: boolean; hasPrev: boolean; page: number } {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, pageSize);
  const total = items.length;
  const start = (safePage - 1) * safeSize;
  const slice = items.slice(start, start + safeSize);

  return {
    items: slice,
    total,
    page: safePage,
    hasNext: start + safeSize < total,
    hasPrev: safePage > 1,
  };
}
