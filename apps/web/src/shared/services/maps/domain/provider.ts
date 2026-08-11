import type {
  GeocodeResult,
  GeocodeSearchOptions,
  GeoPoint,
  MapProviderKind,
  ReverseGeocodeOptions,
  RouteOptions,
  RouteResult,
  TileLayerConfig,
} from './types';

/**
 * Provider-agnostic map backend contract.
 * Swap OSM → Mapbox/Google by implementing this interface in infrastructure only.
 */
export interface MapProvider {
  readonly kind: MapProviderKind;
  getTileLayer(): TileLayerConfig;
  searchAddress(query: string, options?: GeocodeSearchOptions): Promise<GeocodeResult[]>;
  reverseGeocode(point: GeoPoint, options?: ReverseGeocodeOptions): Promise<GeocodeResult | null>;
  route(from: GeoPoint, to: GeoPoint, options?: RouteOptions): Promise<RouteResult>;
}
