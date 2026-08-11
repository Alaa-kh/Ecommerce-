export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface GeocodeResult {
  id: string;
  label: string;
  point: GeoPoint;
  bounds?: MapBounds;
  rawType?: string;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  geometry: GeoPoint[];
}

export interface TileLayerConfig {
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
}

export interface MapMarkerInput {
  id: string;
  point: GeoPoint;
  label?: string;
  /** Intensity 0–1 for heatmap layers. */
  weight?: number;
}

export interface GeocodeSearchOptions {
  signal?: AbortSignal;
  language?: string;
  limit?: number;
}

export interface ReverseGeocodeOptions {
  signal?: AbortSignal;
  language?: string;
}

export interface RouteOptions {
  signal?: AbortSignal;
  profile?: 'driving' | 'walking' | 'cycling';
}

export type MapProviderKind = 'osm' | 'mapbox' | 'google';

export function formatDistance(meters: number, locale = 'en'): string {
  if (!Number.isFinite(meters) || meters < 0) return '—';
  if (meters < 1000) {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(meters) + ' m';
  }
  const km = meters / 1000;
  return (
    new Intl.NumberFormat(locale, { maximumFractionDigits: km >= 10 ? 0 : 1 }).format(km) + ' km'
  );
}

export function formatEta(seconds: number, locale = 'en'): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) {
    return new Intl.NumberFormat(locale).format(totalMinutes) + ' min';
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return new Intl.NumberFormat(locale).format(hours) + ' h';
  }
  return `${new Intl.NumberFormat(locale).format(hours)} h ${new Intl.NumberFormat(locale).format(minutes)} min`;
}

export function isValidGeoPoint(point: GeoPoint | null | undefined): point is GeoPoint {
  if (!point) return false;
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180
  );
}
