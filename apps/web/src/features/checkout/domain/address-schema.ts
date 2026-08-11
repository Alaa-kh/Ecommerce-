import { z } from 'zod';

/** Convert Eastern Arabic / Persian digits to ASCII. */
export function normalizeDigits(value: string): string {
  return value
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

export function normalizeCoord(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return value;
}

export interface ShippingAddressInput {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
}

export const defaultShippingAddress: ShippingAddressInput = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  notes: '',
  latitude: null,
  longitude: null,
};

/** Normalize form payloads before schema validation. */
export function normalizeShippingAddress(
  values: unknown,
): ShippingAddressInput {
  const row =
    values && typeof values === 'object'
      ? (values as Record<string, unknown>)
      : {};

  return {
    fullName: String(row.fullName ?? '').trim(),
    phone: normalizeDigits(String(row.phone ?? '')).trim(),
    line1: String(row.line1 ?? '').trim(),
    line2: String(row.line2 ?? '').trim(),
    city: String(row.city ?? '').trim(),
    region: String(row.region ?? '').trim(),
    postalCode: String(row.postalCode ?? '').trim(),
    country: String(row.country ?? '').trim(),
    notes: String(row.notes ?? '').trim(),
    latitude: normalizeCoord(row.latitude),
    longitude: normalizeCoord(row.longitude),
  };
}

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2).max(80),
  phone: z
    .string()
    .min(8)
    .max(20)
    .regex(/^[+\d\s().-]+$/),
  line1: z.string().min(5).max(120),
  line2: z.string().max(120),
  city: z.string().min(2).max(80),
  region: z.string().min(2).max(80),
  /** Optional — many MENA addresses skip postal codes. */
  postalCode: z.string().max(20),
  country: z.string().min(2).max(80),
  notes: z.string().max(240),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
});

export function parseShippingAddress(values: unknown) {
  return shippingAddressSchema.safeParse(normalizeShippingAddress(values));
}

export function isShippingAddressReady(values: unknown): boolean {
  return parseShippingAddress(values).success;
}
