import { appConfig } from '@/app/config/env';
import { AppError } from '@/shared/types/errors';
import type {
  GeoPoint,
  RouteOptions,
  RouteResult,
} from '@/shared/services/maps/domain/types';
import { cacheGet, cacheSet, mapsFetchJson } from '@/shared/services/maps/infrastructure/http';

interface OsrmRouteResponse {
  code?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: {
      coordinates?: Array<[number, number]>;
    };
  }>;
}

const ROUTE_TTL_MS = 3 * 60 * 1000;

export async function osrmRoute(
  from: GeoPoint,
  to: GeoPoint,
  options: RouteOptions = {},
): Promise<RouteResult> {
  const profile = options.profile ?? 'driving';
  const cacheKey = `osrm:${profile}:${from.lat.toFixed(5)},${from.lng.toFixed(5)}:${to.lat.toFixed(5)},${to.lng.toFixed(5)}`;
  const cached = cacheGet<RouteResult>(cacheKey);
  if (cached) return cached;

  const path = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = new URL(`${appConfig.osrmUrl}/route/v1/${profile}/${path}`);
  url.searchParams.set('overview', 'full');
  url.searchParams.set('geometries', 'geojson');

  const payload = await mapsFetchJson<OsrmRouteResponse>(url.toString(), {
    signal: options.signal,
    errorCode: 'ROUTING_FAILED',
  });

  if (payload.code !== 'Ok' || !payload.routes?.[0]) {
    throw new AppError({
      message: 'No driving route found between these points',
      code: 'ROUTING_NO_ROUTE',
    });
  }

  const route = payload.routes[0];
  const coordinates = route.geometry?.coordinates ?? [];
  const geometry: GeoPoint[] = coordinates.map(([lng, lat]) => ({ lat, lng }));

  if (geometry.length === 0) {
    throw new AppError({
      message: 'Route geometry missing',
      code: 'ROUTING_FAILED',
    });
  }

  const result: RouteResult = {
    distanceMeters: Number(route.distance ?? 0),
    durationSeconds: Number(route.duration ?? 0),
    geometry,
  };

  cacheSet(cacheKey, result, ROUTE_TTL_MS);
  return result;
}
