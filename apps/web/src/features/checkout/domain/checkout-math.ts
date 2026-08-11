import type { CartItem } from '@/features/cart/store/cart-slice';

export type DeliveryMethodId = 'standard' | 'express';
export type PaymentMethodId = 'cod' | 'stripe' | 'paypal';

export interface DeliveryMethod {
  id: DeliveryMethodId;
  fee: number;
}

export const DELIVERY_METHODS: DeliveryMethod[] = [
  { id: 'standard', fee: 8 },
  { id: 'express', fee: 18 },
];

export const FREE_STANDARD_SHIPPING_MIN = 200;

export function calcSubtotal(items: Pick<CartItem, 'price' | 'quantity'>[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calcShippingFee(
  subtotal: number,
  method: DeliveryMethodId,
): number {
  if (method === 'standard' && subtotal >= FREE_STANDARD_SHIPPING_MIN) {
    return 0;
  }
  const found = DELIVERY_METHODS.find((row) => row.id === method);
  return found?.fee ?? 0;
}

export function calcOrderTotals(
  items: Pick<CartItem, 'price' | 'quantity'>[],
  method: DeliveryMethodId,
): { subtotal: number; shipping: number; total: number; itemCount: number } {
  const subtotal = calcSubtotal(items);
  const shipping = calcShippingFee(subtotal, method);
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export function canPlaceOrder(input: {
  itemCount: number;
  paymentMethod: PaymentMethodId;
  stripeConfigured: boolean;
  paypalConfigured: boolean;
}): boolean {
  if (input.itemCount <= 0) return false;
  if (input.paymentMethod === 'cod') return true;
  if (input.paymentMethod === 'stripe') return input.stripeConfigured;
  if (input.paymentMethod === 'paypal') return input.paypalConfigured;
  return false;
}
