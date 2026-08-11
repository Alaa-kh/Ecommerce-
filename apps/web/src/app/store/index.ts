import { configureStore } from '@reduxjs/toolkit';
import { appReducer } from './app-slice';
import { wishlistReducer } from '@/features/wishlist/store/wishlist-slice';
import { cartReducer } from '@/features/cart/store/cart-slice';
import { ordersReducer } from '@/features/orders/store/orders-slice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    wishlist: wishlistReducer,
    cart: cartReducer,
    orders: ordersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: true,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
