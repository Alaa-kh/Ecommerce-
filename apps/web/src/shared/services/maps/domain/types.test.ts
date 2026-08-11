import { describe, expect, it } from 'vitest';
import { formatDistance, formatEta, isValidGeoPoint } from '@/shared/services/maps/domain/types';

describe('map domain helpers', () => {
  it('formats distance and ETA', () => {
    expect(formatDistance(850, 'en')).toContain('m');
    expect(formatDistance(2500, 'en')).toContain('km');
    expect(formatEta(90, 'en')).toContain('min');
    expect(formatEta(3700, 'en')).toContain('h');
  });

  it('validates geo points', () => {
    expect(isValidGeoPoint({ lat: 33.5, lng: 36.2 })).toBe(true);
    expect(isValidGeoPoint({ lat: 120, lng: 36.2 })).toBe(false);
    expect(isValidGeoPoint(null)).toBe(false);
  });
});
