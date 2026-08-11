import { appConfig } from '@/app/config/env';
import type { MapProvider } from '@/shared/services/maps/domain/provider';
import type {
  GeocodeSearchOptions,
  GeoPoint,
  ReverseGeocodeOptions,
  RouteOptions,
  TileLayerConfig,
} from '@/shared/services/maps/domain/types';
import { nominatimReverse, nominatimSearch } from './nominatim-client';
import { osrmRoute } from './osrm-client';

export class OsmMapProvider implements MapProvider {
  readonly kind = 'osm' as const;

  getTileLayer(): TileLayerConfig {
    return {
      url: appConfig.osmTileUrl,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: 'abc',
    };
  }

  searchAddress(query: string, options?: GeocodeSearchOptions) {
    return nominatimSearch(query, options);
  }

  reverseGeocode(point: GeoPoint, options?: ReverseGeocodeOptions) {
    return nominatimReverse(point, options);
  }

  route(from: GeoPoint, to: GeoPoint, options?: RouteOptions) {
    return osrmRoute(from, to, options);
  }
}
