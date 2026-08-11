import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface WishlistItem {
  productId: number;
  title: string;
  price: number;
  imageUrl: string | null;
  slug: string;
  addedAt: string;
}

interface WishlistState {
  items: WishlistItem[];
}

const STORAGE_KEY = 'lumina.wishlist.v1';

function readStored(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is WishlistItem => {
      if (!item || typeof item !== 'object') return false;
      const row = item as Partial<WishlistItem>;
      return typeof row.productId === 'number' && typeof row.title === 'string';
    });
  } catch {
    return [];
  }
}

function persist(items: WishlistItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const initialState: WishlistState = {
  items: readStored(),
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlistItem(state, action: PayloadAction<WishlistItem>) {
      const index = state.items.findIndex((item) => item.productId === action.payload.productId);
      if (index >= 0) {
        state.items.splice(index, 1);
      } else {
        state.items.unshift(action.payload);
      }
      persist(state.items);
    },
    removeWishlistItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter((item) => item.productId !== action.payload);
      persist(state.items);
    },
    clearWishlist(state) {
      state.items = [];
      persist(state.items);
    },
  },
});

export const { toggleWishlistItem, removeWishlistItem, clearWishlist } = wishlistSlice.actions;
export const wishlistReducer = wishlistSlice.reducer;

export function selectWishlistCount(state: { wishlist: WishlistState }): number {
  return state.wishlist.items.length;
}

export function selectIsWishlisted(
  state: { wishlist: WishlistState },
  productId: number,
): boolean {
  return state.wishlist.items.some((item) => item.productId === productId);
}
