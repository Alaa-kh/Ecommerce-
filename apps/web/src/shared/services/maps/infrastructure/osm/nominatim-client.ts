import { appConfig } from '@/app/config/env';
import { AppError } from '@/shared/types/errors';
import type {
  GeocodeResult,
  GeocodeSearchOptions,
  GeoPoint,
  ReverseGeocodeOptions,
} from '@/shared/services/maps/domain/types';
import { cacheGet, cacheSet, mapsFetchJson } from '@/shared/services/maps/infrastructure/http';

interface NominatimItem {
  place_id?: number | string;
  display_name?: string;
  lat?: string;
  lon?: string;
  boundingbox?: string[];
  type?: string;
  class?: string;
}

const SEARCH_TTL_MS = 5 * 60 * 1000;
const REVERSE_TTL_MS = 10 * 60 * 1000;
const USER_AGENT = `${appConfig.appName}/1.0 (lumina-market; contact@local.dev)`;

function mapItem(item: NominatimItem): GeocodeResult | null {
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !item.display_name) return null;

  let bounds: GeocodeResult['bounds'];
  if (item.boundingbox && item.boundingbox.length === 4) {
    const south = Number(item.boundingbox[0]);
    const north = Number(item.boundingbox[1]);
    const west = Number(item.boundingbox[2]);
    const east = Number(item.boundingbox[3]);
    if ([south, north, west, east].every(Number.isFinite)) {
      bounds = { south, west, north, east };
    }
  }

  return {
    id: String(item.place_id ?? `${lat},${lng}`),
    label: item.display_name,
    point: { lat, lng },
    bounds,
    rawType: item.type ?? item.class,
  };
}

export async function nominatimSearch(
  query: string,
  options: GeocodeSearchOptions = {},
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const limit = Math.min(10, Math.max(1, options.limit ?? 6));
  const language = options.language ?? 'en';
  const cacheKey = `nominatim:search:${language}:${limit}:${trimmed.toLowerCase()}`;
  const cached = cacheGet<GeocodeResult[]>(cacheKey);
  if (cached) return cached;

  const url = new URL(`${appConfig.nominatimUrl}/search`);
  url.searchParams.set('q', trimmed);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('accept-language', language);

  const payload = await mapsFetchJson<NominatimItem[]>(url.toString(), {
    signal: options.signal,
    errorCode: 'GEOCODING_SEARCH_FAILED',
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!Array.isArray(payload)) {
    throw new AppError({
      message: 'Unexpected geocoding response',
      code: 'GEOCODING_SEARCH_FAILED',
    });
  }

  const results = payload
    .map(mapItem)
    .filter((item): item is GeocodeResult => item !== null);
  cacheSet(cacheKey, results, SEARCH_TTL_MS);
  return results;
}

export async function nominatimReverse(
  point: GeoPoint,
  options: ReverseGeocodeOptions = {},
): Promise<GeocodeResult | null> {
  const language = options.language ?? 'en';
  const rounded = `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`;
  const cacheKey = `nominatim:reverse:${language}:${rounded}`;
  const cached = cacheGet<GeocodeResult | null>(cacheKey);
  if (cached !== undefined) return cached;

  const url = new URL(`${appConfig.nominatimUrl}/reverse`);
  url.searchParams.set('lat', String(point.lat));
  url.searchParams.set('lon', String(point.lng));
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', language);

  const payload = await mapsFetchJson<NominatimItem>(url.toString(), {
    signal: options.signal,
    errorCode: 'GEOCODING_REVERSE_FAILED',
    headers: { 'User-Agent': USER_AGENT },
  });

  const mapped = mapItem(payload);
  cacheSet(cacheKey, mapped, REVERSE_TTL_MS);
  return mapped;
}
