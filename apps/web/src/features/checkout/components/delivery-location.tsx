import { DeliveryMapPicker } from '@/features/maps/components/delivery-map-picker';
import { MapErrorBoundary } from '@/features/maps/components/map-error-boundary';
import { useTranslation } from 'react-i18next';

interface DeliveryLocationProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onChange: (coords: {
    latitude: number | null;
    longitude: number | null;
    label?: string | null;
  }) => void;
}

/** Checkout delivery map — OSM/Leaflet via MapService (failure-isolated). */
export function DeliveryLocation(props: DeliveryLocationProps) {
  const { t } = useTranslation();

  return (
    <MapErrorBoundary
      fallback={
        <div role="status" style={{ padding: '1rem' }}>
          <strong>{t('maps.mapError')}</strong>
          <p>{t('checkout.mapBody')}</p>
        </div>
      }
    >
      <DeliveryMapPicker {...props} enableCluster enableHeatmap={false} />
    </MapErrorBoundary>
  );
}
