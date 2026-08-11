function readEnv(key: keyof ImportMetaEnv, fallback = ''): string {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

export type MapProviderId = 'osm' | 'mapbox' | 'google';

export const appConfig = {
  appName: readEnv('VITE_APP_NAME', 'Lumina Market'),
  defaultLocale: readEnv('VITE_DEFAULT_LOCALE', 'en'),
  supportedLocales: readEnv('VITE_SUPPORTED_LOCALES', 'en,ar')
    .split(',')
    .map((locale) => locale.trim())
    .filter(Boolean),
  platziApiUrl: readEnv('VITE_PLATZI_API_URL', 'https://api.escuelajs.co/api/v1').replace(
    /\/$/,
    '',
  ),
  supabaseUrl: readEnv('VITE_SUPABASE_URL'),
  supabasePublishableKey: readEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
  /** Active map provider. Use `osm` for OpenStreetMap (no API key). */
  mapProvider: readEnv('VITE_MAP_PROVIDER', 'osm').toLowerCase() as MapProviderId | string,
  nominatimUrl: readEnv(
    'VITE_NOMINATIM_URL',
    'https://nominatim.openstreetmap.org',
  ).replace(/\/$/, ''),
  osrmUrl: readEnv('VITE_OSRM_URL', 'https://router.project-osrm.org').replace(/\/$/, ''),
  osmTileUrl: readEnv(
    'VITE_OSM_TILE_URL',
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ),
  /** Optional warehouse / fulfillment origin for delivery ETA routes. */
  fulfillmentLatitude: Number(readEnv('VITE_FULFILLMENT_LAT', '33.5138')),
  fulfillmentLongitude: Number(readEnv('VITE_FULFILLMENT_LNG', '36.2765')),
  stripePublishableKey: readEnv('VITE_STRIPE_PUBLISHABLE_KEY'),
  paypalClientId: readEnv('VITE_PAYPAL_CLIENT_ID'),
  /** Optional managed chat endpoint (POST { message, locale } → { text, suggestions? }). */
  chatApiUrl: readEnv('VITE_CHAT_API_URL'),
  heroVideoUrl: readEnv(
    'VITE_HERO_VIDEO_URL',
    'https://assets.mixkit.co/videos/25516/25516-720.mp4',
  ),
  heroVideoUrlFallback: readEnv(
    'VITE_HERO_VIDEO_URL_FALLBACK',
    'https://assets.mixkit.co/videos/25516/25516-360.mp4',
  ),
} as const;

export type AppConfig = typeof appConfig;

export function isStripeConfigured(): boolean {
  return appConfig.stripePublishableKey.length > 0;
}

export function isPaypalConfigured(): boolean {
  return appConfig.paypalClientId.length > 0;
}

/** Maps are ready when provider is OpenStreetMap (no third-party API key). */
export function isMapsConfigured(): boolean {
  return appConfig.mapProvider === 'osm';
}

export function getFulfillmentPoint(): { lat: number; lng: number } | null {
  const { fulfillmentLatitude: lat, fulfillmentLongitude: lng } = appConfig;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}
