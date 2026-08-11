import { describe, expect, it } from 'vitest';
import {
  isShippingAddressReady,
  normalizeDigits,
  parseShippingAddress,
} from '@/features/checkout/domain/address-schema';

describe('address schema', () => {
  it('normalizes Arabic-Indic phone digits', () => {
    expect(normalizeDigits('٠٩١٢٣٤٥٦٧٨')).toBe('0912345678');
  });

  it('accepts a typical COD address without postal code or map pin', () => {
    const parsed = parseShippingAddress({
      fullName: 'علاء خالد',
      phone: '٠٩١٢٣٤٥٦٧٨',
      line1: 'شارع بغداد',
      line2: '',
      city: 'دمشق',
      region: 'دمشق',
      postalCode: '',
      country: 'سوريا',
      notes: '',
      latitude: null,
      longitude: null,
    });
    expect(parsed.success).toBe(true);
  });

  it('treats undefined coords as null', () => {
    expect(
      isShippingAddressReady({
        fullName: 'Alaa',
        phone: '0912345678',
        line1: 'Main street 12',
        city: 'Damascus',
        region: 'Damascus',
        country: 'Syria',
      }),
    ).toBe(true);
  });

  it('rejects short phone numbers', () => {
    expect(
      isShippingAddressReady({
        fullName: 'Alaa',
        phone: '123',
        line1: 'Main street 12',
        city: 'Damascus',
        region: 'Damascus',
        country: 'Syria',
      }),
    ).toBe(false);
  });
});
