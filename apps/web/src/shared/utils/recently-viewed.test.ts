import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearRecentlyViewed,
  readRecentlyViewed,
  trackRecentlyViewed,
} from '@/shared/utils/recently-viewed';

describe('recently viewed', () => {
  beforeEach(() => {
    clearRecentlyViewed();
  });

  it('stores newest first and dedupes by product id', () => {
    trackRecentlyViewed({
      productId: 1,
      title: 'A',
      price: 10,
      imageUrl: null,
      slug: 'a',
    });
    trackRecentlyViewed({
      productId: 2,
      title: 'B',
      price: 20,
      imageUrl: null,
      slug: 'b',
    });
    trackRecentlyViewed({
      productId: 1,
      title: 'A updated',
      price: 12,
      imageUrl: null,
      slug: 'a',
    });

    const rows = readRecentlyViewed();
    expect(rows.map((row) => row.productId)).toEqual([1, 2]);
    expect(rows[0]?.title).toBe('A updated');
  });
});
