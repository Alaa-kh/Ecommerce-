export interface RecentlyViewedItem {
  productId: number;
  title: string;
  price: number;
  imageUrl: string | null;
  slug: string;
  viewedAt: string;
}

const STORAGE_KEY = 'lumina.recentlyViewed.v1';
const MAX_ITEMS = 12;

/** In-memory fallback when localStorage is unavailable (SSR / locked storage). */
let memoryStore: RecentlyViewedItem[] | null = null;

function isRecentlyViewedItem(value: unknown): value is RecentlyViewedItem {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<RecentlyViewedItem>;
  return (
    typeof row.productId === 'number' &&
    typeof row.title === 'string' &&
    typeof row.price === 'number' &&
    typeof row.slug === 'string' &&
    typeof row.viewedAt === 'string' &&
    (row.imageUrl === null || typeof row.imageUrl === 'string')
  );
}

function canUseStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function readRecentlyViewed(): RecentlyViewedItem[] {
  if (memoryStore) return memoryStore.slice(0, MAX_ITEMS);

  if (!canUseStorage()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentlyViewedItem).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function trackRecentlyViewed(
  item: Omit<RecentlyViewedItem, 'viewedAt'> & { viewedAt?: string },
): RecentlyViewedItem[] {
  const nextItem: RecentlyViewedItem = {
    productId: item.productId,
    title: item.title,
    price: item.price,
    imageUrl: item.imageUrl,
    slug: item.slug,
    viewedAt: item.viewedAt ?? new Date().toISOString(),
  };

  const existing = readRecentlyViewed().filter(
    (row) => row.productId !== nextItem.productId,
  );
  const next = [nextItem, ...existing].slice(0, MAX_ITEMS);

  memoryStore = next;

  if (canUseStorage()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* keep memoryStore */
    }
  }

  return next;
}

export function clearRecentlyViewed(): void {
  memoryStore = null;
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
