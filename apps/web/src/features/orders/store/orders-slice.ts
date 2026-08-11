import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CartItem } from '@/features/cart/store/cart-slice';
import type { DeliveryMethodId, PaymentMethodId } from '@/features/checkout/domain/checkout-math';
import type { ShippingAddressInput } from '@/features/checkout/domain/address-schema';

export type OrderStatus = 'placed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderLineItem {
  productId: number;
  title: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

export interface OrderRecord {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: PaymentMethodId;
  deliveryMethod: DeliveryMethodId;
  address: ShippingAddressInput;
  items: OrderLineItem[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: 'USD';
}

interface OrdersState {
  items: OrderRecord[];
}

const STORAGE_KEY = 'lumina.orders.v1';

function isOrderRecord(value: unknown): value is OrderRecord {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<OrderRecord>;
  return (
    typeof row.id === 'string' &&
    typeof row.createdAt === 'string' &&
    Array.isArray(row.items) &&
    typeof row.total === 'number'
  );
}

function readStored(): OrderRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isOrderRecord);
  } catch {
    return [];
  }
}

function persist(items: OrderRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function createOrderId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LM-${stamp}-${rand}`;
}

export interface PlaceOrderPayload {
  id: string;
  items: CartItem[];
  address: ShippingAddressInput;
  deliveryMethod: DeliveryMethodId;
  paymentMethod: PaymentMethodId;
  subtotal: number;
  shipping: number;
  total: number;
}

const ordersSlice = createSlice({
  name: 'orders',
  initialState: { items: readStored() } as OrdersState,
  reducers: {
    placeOrder(state, action: PayloadAction<PlaceOrderPayload>) {
      const order: OrderRecord = {
        id: action.payload.id,
        createdAt: new Date().toISOString(),
        status: 'placed',
        paymentMethod: action.payload.paymentMethod,
        deliveryMethod: action.payload.deliveryMethod,
        address: action.payload.address,
        items: action.payload.items.map((item) => ({
          productId: item.productId,
          title: item.title,
          price: item.price,
          imageUrl: item.imageUrl,
          quantity: item.quantity,
        })),
        subtotal: action.payload.subtotal,
        shipping: action.payload.shipping,
        total: action.payload.total,
        currency: 'USD',
      };
      state.items.unshift(order);
      persist(state.items);
    },
  },
});

export const { placeOrder } = ordersSlice.actions;
export const ordersReducer = ordersSlice.reducer;

export function selectOrders(state: { orders: OrdersState }): OrderRecord[] {
  return state.orders.items;
}

export function selectOrderById(
  state: { orders: OrdersState },
  orderId: string | undefined,
): OrderRecord | undefined {
  if (!orderId) return undefined;
  return state.orders.items.find((order) => order.id === orderId);
}
