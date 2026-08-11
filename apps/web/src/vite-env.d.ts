/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_DEFAULT_LOCALE?: string;
  readonly VITE_SUPPORTED_LOCALES?: string;
  readonly VITE_PLATZI_API_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_MAP_PROVIDER?: string;
  readonly VITE_NOMINATIM_URL?: string;
  readonly VITE_OSRM_URL?: string;
  readonly VITE_OSM_TILE_URL?: string;
  readonly VITE_FULFILLMENT_LAT?: string;
  readonly VITE_FULFILLMENT_LNG?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly VITE_PAYPAL_CLIENT_ID?: string;
  readonly VITE_CHAT_API_URL?: string;
  readonly VITE_HERO_VIDEO_URL?: string;
  readonly VITE_HERO_VIDEO_URL_FALLBACK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module 'leaflet.heat';
declare module 'leaflet.markercluster';
