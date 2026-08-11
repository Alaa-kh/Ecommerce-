import { describe, expect, it } from 'vitest';
import {
  calcOrderTotals,
  calcShippingFee,
  canPlaceOrder,
  FREE_STANDARD_SHIPPING_MIN,
} from '@/features/checkout/domain/checkout-math';

describe('checkout math', () => {
  it('calculates subtotal and shipping', () => {
    const totals = calcOrderTotals(
      [
        { price: 40, quantity: 2 },
        { price: 10, quantity: 1 },
      ],
      'standard',
    );
    expect(totals.subtotal).toBe(90);
    expect(totals.shipping).toBe(8);
    expect(totals.total).toBe(98);
    expect(totals.itemCount).toBe(3);
  });

  it('waives standard shipping above threshold', () => {
    expect(calcShippingFee(FREE_STANDARD_SHIPPING_MIN, 'standard')).toBe(0);
    expect(calcShippingFee(FREE_STANDARD_SHIPPING_MIN, 'express')).toBe(18);
  });

  it('allows COD always and gated card methods only when configured', () => {
    expect(
      canPlaceOrder({
        itemCount: 1,
        paymentMethod: 'cod',
        stripeConfigured: false,
        paypalConfigured: false,
      }),
    ).toBe(true);
    expect(
      canPlaceOrder({
        itemCount: 1,
        paymentMethod: 'stripe',
        stripeConfigured: false,
        paypalConfigured: false,
      }),
    ).toBe(false);
    expect(
      canPlaceOrder({
        itemCount: 1,
        paymentMethod: 'stripe',
        stripeConfigured: true,
        paypalConfigured: false,
      }),
    ).toBe(true);
    expect(
      canPlaceOrder({
        itemCount: 0,
        paymentMethod: 'cod',
        stripeConfigured: true,
        paypalConfigured: true,
      }),
    ).toBe(false);
  });
});
