import { describe, expect, it } from 'vitest';
import { mapProduct } from '@/features/products/api/productMapper';
import { paginateItems, sortProducts } from '@/features/products/utils/catalog-query';
import type { Product } from '@/shared/types/catalog';
import { formatMoney } from '@/shared/utils/money';

const sampleProducts: Product[] = [
  {
    id: 1,
    title: 'Zebra Chair',
    slug: 'zebra-chair',
    price: 40,
    description: 'A',
    images: ['https://example.com/a.jpg'],
    category: {
      id: 1,
      name: 'Furniture',
      slug: 'furniture',
      imageUrl: 'https://example.com/c.jpg',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: null,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: null,
  },
  {
    id: 2,
    title: 'Apple Lamp',
    slug: 'apple-lamp',
    price: 20,
    description: 'B',
    images: [],
    category: {
      id: 2,
      name: 'Electronics',
      slug: 'electronics',
      imageUrl: 'https://example.com/d.jpg',
      createdAt: '2024-02-01T00:00:00.000Z',
      updatedAt: null,
    },
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: null,
  },
];

describe('productMapper', () => {
  it('maps Platzi DTOs into domain products and sanitizes image strings', () => {
    const product = mapProduct({
      id: 9,
      title: 'Cap',
      slug: 'cap',
      price: 12,
      description: 'Nice',
      images: ['["https://i.imgur.com/cBuLvBi.jpeg"]', 'https://i.imgur.com/KeqG6r4.jpeg'],
      category: {
        id: 1,
        name: 'Clothes',
        slug: 'clothes',
        image: 'https://example.com/cat.jpg',
        creationAt: '2024-01-01T00:00:00.000Z',
      },
      creationAt: '2024-01-02T00:00:00.000Z',
    });

    expect(product.id).toBe(9);
    expect(product.category.name).toBe('Clothes');
    expect(product.images[0]).toContain('imgur.com');
    expect(product.images).toHaveLength(2);
  });
});

describe('catalog-query', () => {
  it('sorts by price ascending and descending', () => {
    expect(sortProducts(sampleProducts, 'price_asc').map((p) => p.id)).toEqual([2, 1]);
    expect(sortProducts(sampleProducts, 'price_desc').map((p) => p.id)).toEqual([1, 2]);
  });

  it('paginates without inventing server totals', () => {
    const page = paginateItems(sampleProducts, 1, 1);
    expect(page.items).toHaveLength(1);
    expect(page.total).toBe(2);
    expect(page.hasNext).toBe(true);
    expect(page.hasPrev).toBe(false);
  });
});

describe('money', () => {
  it('formats USD amounts', () => {
    expect(formatMoney(20, 'en')).toMatch(/20/);
  });
});
