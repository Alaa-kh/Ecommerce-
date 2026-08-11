import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getFulfillmentPoint, isMapsConfigured } from '@/app/config/env';
import { LeafletMapCanvas } from '@/features/maps/components/leaflet-map-canvas';
import { MapErrorBoundary } from '@/features/maps/components/map-error-boundary';
import { useMapSearch } from '@/features/maps/hooks/use-map-search';
import { useReverseGeocode } from '@/features/maps/hooks/use-reverse-geocode';
import { useRoute } from '@/features/maps/hooks/use-route';
import { useUserLocation } from '@/features/maps/hooks/use-user-location';
import { Button } from '@/shared/components/ui/button';
import {
  formatDistance,
  formatEta,
  isValidGeoPoint,
  mapService,
  type GeoPoint,
  type MapMarkerInput,
} from '@/shared/services/maps';
import styles from './delivery-map-picker.module.css';

export interface DeliveryMapPickerProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onChange: (coords: {
    latitude: number | null;
    longitude: number | null;
    label?: string | null;
  }) => void;
  extraMarkers?: MapMarkerInput[];
  enableCluster?: boolean;
  enableHeatmap?: boolean;
}

export function DeliveryMapPicker({
  latitude,
  longitude,
  onChange,
  extraMarkers = [],
  enableCluster = true,
  enableHeatmap = false,
}: DeliveryMapPickerProps) {
  const { t, i18n } = useTranslation();
  const mapsReady = isMapsConfigured();
  const language = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const selected = useMemo(() => {
    if (
      latitude != null &&
      longitude != null &&
      isValidGeoPoint({ lat: latitude, lng: longitude })
    ) {
      return { lat: latitude, lng: longitude };
    }
    return null;
  }, [latitude, longitude]);

  const search = useMapSearch(language);
  const reverse = useReverseGeocode(selected, language);
  const userLocation = useUserLocation();
  const fulfillment = getFulfillmentPoint();
  const routeQuery = useRoute(fulfillment, selected);
  const [mapReady, setMapReady] = useState(false);
  const handleMapReady = useCallback(() => setMapReady(true), []);

  const markers = useMemo(() => {
    const list: MapMarkerInput[] = [...extraMarkers];
    if (fulfillment) {
      list.push({
        id: 'fulfillment',
        point: fulfillment,
        label: t('maps.fulfillment'),
        weight: 0.4,
      });
    }
    if (selected) {
      list.push({
        id: 'delivery',
        point: selected,
        label: reverse.result?.label ?? t('maps.selectedLocation'),
        weight: 1,
      });
    }
    if (userLocation.point) {
      list.push({
        id: 'user',
        point: userLocation.point,
        label: t('maps.yourLocation'),
        weight: 0.8,
      });
    }
    return list;
  }, [extraMarkers, fulfillment, selected, reverse.result?.label, t, userLocation.point]);

  const tile = useMemo(() => {
    if (!mapsReady) return null;
    try {
      return mapService.getTileLayer();
    } catch {
      return null;
    }
  }, [mapsReady]);

  function selectPoint(point: GeoPoint, label?: string | null) {
    onChange({
      latitude: point.lat,
      longitude: point.lng,
      label: label ?? null,
    });
  }

  if (!mapsReady || !tile) {
    return (
      <div className={styles.wrap} role="status">
        <div className={styles.header}>
          <h3>{t('checkout.mapTitle')}</h3>
          <p>{t('checkout.mapBody')}</p>
        </div>
        <div className={styles.notice}>
          <strong>{t('checkout.mapsNotConfiguredTitle')}</strong>
          <p>{t('checkout.mapsNotConfiguredBody')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h3>{t('checkout.mapTitle')}</h3>
        <p>{t('checkout.mapBody')}</p>
      </div>

      <div className={styles.search}>
        <label className={styles.searchField}>
          <span className={styles.srOnly}>{t('maps.searchLabel')}</span>
          <input
            type="search"
            value={search.query}
            onChange={(event) => search.setQuery(event.target.value)}
            placeholder={t('maps.searchPlaceholder')}
            autoComplete="off"
          />
        </label>

        {search.status === 'loading' ? (
          <p className={styles.state}>{t('maps.searchLoading')}</p>
        ) : null}
        {search.status === 'empty' ? (
          <p className={styles.state}>{t('maps.searchEmpty')}</p>
        ) : null}
        {search.status === 'error' ? (
          <p className={styles.stateError} role="alert">
            {search.error}
          </p>
        ) : null}
        {search.status === 'success' ? (
          <ul className={styles.suggestions}>
            {search.results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    selectPoint(item.point, item.label);
                    search.clear();
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className={styles.toolbar}>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          isLoading={userLocation.status === 'loading'}
          onClick={() => {
            userLocation.locate();
          }}
        >
          {t('maps.useMyLocation')}
        </Button>
        {selected ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange({ latitude: null, longitude: null, label: null })}
          >
            {t('maps.clearPin')}
          </Button>
        ) : null}
      </div>

      {userLocation.status === 'error' ? (
        <p className={styles.stateError} role="alert">
          {userLocation.error}
        </p>
      ) : null}

      {userLocation.status === 'success' && userLocation.point ? (
        <div className={styles.inlineActions}>
          <Button
            type="button"
            size="sm"
            onClick={() => selectPoint(userLocation.point as GeoPoint)}
          >
            {t('maps.setPinToMyLocation')}
          </Button>
        </div>
      ) : null}

      <div className={styles.mapFrame}>
        {!mapReady ? (
          <div className={styles.mapLoading} aria-busy="true">
            {t('maps.mapLoading')}
          </div>
        ) : null}
        <MapErrorBoundary
          fallback={
            <div className={styles.mapLoading} role="alert">
              {t('maps.mapError')}
            </div>
          }
        >
          <LeafletMapCanvas
            tile={tile}
            center={selected ?? fulfillment ?? { lat: 33.5138, lng: 36.2765 }}
            markers={markers}
            selected={selected}
            route={routeQuery.route}
            enableCluster={enableCluster && markers.length >= 8}
            enableHeatmap={enableHeatmap}
            onReady={handleMapReady}
            onSelectPoint={(point) => selectPoint(point)}
          />
        </MapErrorBoundary>
      </div>

      <div className={styles.meta}>
        {reverse.status === 'loading' ? (
          <p className={styles.state}>{t('maps.reverseLoading')}</p>
        ) : null}
        {reverse.status === 'success' && reverse.result ? (
          <p className={styles.address}>
            <strong>{t('maps.selectedAddress')}</strong>
            <span>{reverse.result.label}</span>
          </p>
        ) : null}
        {reverse.status === 'error' ? (
          <p className={styles.stateError} role="alert">
            {reverse.error}
          </p>
        ) : null}
        {!selected ? <p className={styles.state}>{t('maps.pickHint')}</p> : null}

        {routeQuery.status === 'loading' ? (
          <p className={styles.state}>{t('maps.routeLoading')}</p>
        ) : null}
        {routeQuery.status === 'success' && routeQuery.route ? (
          <dl className={styles.routeStats}>
            <div>
              <dt>{t('maps.distance')}</dt>
              <dd>{formatDistance(routeQuery.route.distanceMeters, i18n.language)}</dd>
            </div>
            <div>
              <dt>{t('maps.eta')}</dt>
              <dd>{formatEta(routeQuery.route.durationSeconds, i18n.language)}</dd>
            </div>
          </dl>
        ) : null}
        {routeQuery.status === 'error' ? (
          <p className={styles.stateError} role="alert">
            {routeQuery.error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
