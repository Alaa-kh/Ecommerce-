import { appConfig, isMapsConfigured } from '@/app/config/env';
import { AppError } from '@/shared/types/errors';
import type { MapProvider } from '@/shared/services/maps/domain/provider';
import { OsmMapProvider } from '@/shared/services/maps/infrastructure/osm/osm-provider';

let cachedProvider: MapProvider | null = null;

/**
 * Resolves the active map provider from env.
 * Future Mapbox/Google adapters plug in here only.
 */
export function getMapProvider(): MapProvider {
  if (!isMapsConfigured()) {
    throw new AppError({
      message: 'Maps are not configured. Set VITE_MAP_PROVIDER=osm.',
      code: 'MAPS_NOT_CONFIGURED',
    });
  }

  if (cachedProvider) return cachedProvider;

  switch (appConfig.mapProvider) {
    case 'osm':
      cachedProvider = new OsmMapProvider();
      return cachedProvider;
    case 'mapbox':
    case 'google':
      throw new AppError({
        message: `Map provider "${appConfig.mapProvider}" is not implemented. Use VITE_MAP_PROVIDER=osm.`,
        code: 'MAPS_PROVIDER_UNSUPPORTED',
      });
    default:
      throw new AppError({
        message: `Unknown map provider "${appConfig.mapProvider}". Use osm.`,
        code: 'MAPS_PROVIDER_UNKNOWN',
      });
  }
}

export const mapService = {
  isConfigured: isMapsConfigured,
  getProvider: getMapProvider,
  getTileLayer() {
    return getMapProvider().getTileLayer();
  },
};

export const geocodingService = {
  search(query: string, options?: Parameters<MapProvider['searchAddress']>[1]) {
    return getMapProvider().searchAddress(query, options);
  },
  reverse(point: Parameters<MapProvider['reverseGeocode']>[0], options?: Parameters<MapProvider['reverseGeocode']>[1]) {
    return getMapProvider().reverseGeocode(point, options);
  },
};

export const routingService = {
  route(
    from: Parameters<MapProvider['route']>[0],
    to: Parameters<MapProvider['route']>[1],
    options?: Parameters<MapProvider['route']>[2],
  ) {
    return getMapProvider().route(from, to, options);
  },
};
