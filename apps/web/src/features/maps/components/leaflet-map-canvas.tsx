import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import type { TileLayerConfig, GeoPoint, MapMarkerInput, RouteResult } from '@/shared/services/maps';
import {
  ClusterLayer,
  FitBounds,
  HeatLayer,
  InvalidateSizeOnMount,
  MapClickHandler,
  RouteLayerEffect,
} from '@/features/maps/components/map-layers';
import { createDeliveryIcon, ensureLeafletDefaultIcon } from '@/features/maps/utils/leaflet-icons';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import styles from './leaflet-map-canvas.module.css';

interface LeafletMapCanvasProps {
  tile: TileLayerConfig;
  center: GeoPoint;
  markers: MapMarkerInput[];
  selected: GeoPoint | null;
  route: RouteResult | null;
  enableCluster: boolean;
  enableHeatmap: boolean;
  onReady: () => void;
  onSelectPoint: (point: GeoPoint) => void;
}

export function LeafletMapCanvas({
  tile,
  center,
  markers,
  selected,
  route,
  enableCluster,
  enableHeatmap,
  onReady,
  onSelectPoint,
}: LeafletMapCanvasProps) {
  // Avoid StrictMode double-init crash: "Map container is already initialized".
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    ensureLeafletDefaultIcon();
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    onReady();
  }, [mounted, onReady]);

  const fitPoints = useMemo(() => {
    const points = markers.map((marker) => marker.point);
    if (route?.geometry.length) {
      const first = route.geometry[0];
      const mid = route.geometry[Math.floor(route.geometry.length / 2)];
      const last = route.geometry[route.geometry.length - 1];
      if (first) points.push(first);
      if (mid) points.push(mid);
      if (last) points.push(last);
    }
    return points;
  }, [markers, route]);

  if (!mounted) {
    return <div className={styles.root} aria-hidden="true" />;
  }

  return (
    <div className={styles.root}>
      <MapContainer
        key="lumina-delivery-map"
        center={[center.lat, center.lng]}
        zoom={13}
        className={styles.map}
        scrollWheelZoom
        attributionControl
      >
        <TileLayer
          url={tile.url}
          attribution={tile.attribution}
          maxZoom={tile.maxZoom}
          subdomains={tile.subdomains ?? 'abc'}
        />
        <InvalidateSizeOnMount ready={mounted} />
        <MapClickHandler onSelect={onSelectPoint} />
        <FitBounds points={fitPoints} />
        <RouteLayerEffect route={route} />
        <HeatLayer markers={markers} enabled={enableHeatmap} />
        {enableCluster ? (
          <ClusterLayer markers={markers} enabled />
        ) : (
          markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.point.lat, marker.point.lng]}
              icon={createDeliveryIcon()}
              eventHandlers={{
                click: () => onSelectPoint(marker.point),
              }}
            />
          ))
        )}
        {selected && enableCluster ? (
          <Marker position={[selected.lat, selected.lng]} icon={createDeliveryIcon()} />
        ) : null}
      </MapContainer>
    </div>
  );
}
