import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  productId: number;
  title: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

const STORAGE_KEY = 'lumina.cart.v1';

function readStored(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CartItem => {
      if (!item || typeof item !== 'object') return false;
      const row = item as Partial<CartItem>;
      return typeof row.productId === 'number' && typeof row.quantity === 'number';
    });
  } catch {
    return [];
  }
}

function persist(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: readStored() } as CartState,
  reducers: {
    addCartItem(
      state,
      action: PayloadAction<Omit<CartItem, 'quantity'> & { quantity?: number }>,
    ) {
      const qty = Math.max(1, action.payload.quantity ?? 1);
      const existing = state.items.find((item) => item.productId === action.payload.productId);
      if (existing) {
        existing.quantity = Math.min(20, existing.quantity + qty);
      } else {
        state.items.unshift({
          productId: action.payload.productId,
          title: action.payload.title,
          price: action.payload.price,
          imageUrl: action.payload.imageUrl,
          quantity: qty,
        });
      }
      persist(state.items);
    },
    updateCartQuantity(
      state,
      action: PayloadAction<{ productId: number; quantity: number }>,
    ) {
      const item = state.items.find((row) => row.productId === action.payload.productId);
      if (!item) return;
      item.quantity = Math.min(20, Math.max(1, action.payload.quantity));
      persist(state.items);
    },
    removeCartItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter((item) => item.productId !== action.payload);
      persist(state.items);
    },
    clearCart(state) {
      state.items = [];
      persist(state.items);
    },
  },
});

export const { addCartItem, updateCartQuantity, removeCartItem, clearCart } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;

export function selectCartCount(state: { cart: CartState }): number {
  return state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
}
