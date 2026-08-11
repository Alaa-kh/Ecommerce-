import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.heat';
import type { GeoPoint, MapMarkerInput, RouteResult } from '@/shared/services/maps';
import { createDeliveryIcon } from '@/features/maps/utils/leaflet-icons';

interface MapClickHandlerProps {
  onSelect: (point: GeoPoint) => void;
}

export function MapClickHandler({ onSelect }: MapClickHandlerProps) {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

interface FitBoundsProps {
  points: GeoPoint[];
}

export function FitBounds({ points }: FitBoundsProps) {
  const map = useMap();
  const signature = points
    .map((point) => `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`)
    .join('|');

  useEffect(() => {
    if (points.length === 0) return;
    const first = points[0];
    if (!first) return;
    try {
      if (points.length === 1) {
        map.setView([first.lat, first.lng], Math.max(map.getZoom(), 14), {
          animate: true,
        });
        return;
      }
      const bounds = L.latLngBounds(
        points.map((point) => [point.lat, point.lng] as [number, number]),
      );
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15, animate: true });
    } catch {
      // Ignore fit errors during map teardown / StrictMode remount.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature encodes points
  }, [map, signature]);

  return null;
}

interface InvalidateSizeOnMountProps {
  ready: boolean;
}

export function InvalidateSizeOnMount({ ready }: InvalidateSizeOnMountProps) {
  const map = useMap();
  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(id);
  }, [map, ready]);
  return null;
}

interface ClusterLayerProps {
  markers: MapMarkerInput[];
  enabled: boolean;
}

export function ClusterLayer({ markers, enabled }: ClusterLayerProps) {
  const map = useMap();
  const signature = markers
    .map((marker) => `${marker.id}:${marker.point.lat.toFixed(4)},${marker.point.lng.toFixed(4)}`)
    .join('|');

  useEffect(() => {
    if (!enabled || markers.length === 0) return;
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 48,
    });

    for (const marker of markers) {
      const layer = L.marker([marker.point.lat, marker.point.lng], {
        icon: createDeliveryIcon(),
      });
      if (marker.label) layer.bindPopup(marker.label);
      group.addLayer(layer);
    }

    map.addLayer(group);
    return () => {
      map.removeLayer(group);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature encodes markers
  }, [map, enabled, signature]);

  return null;
}

interface HeatLayerProps {
  markers: MapMarkerInput[];
  enabled: boolean;
}

export function HeatLayer({ markers, enabled }: HeatLayerProps) {
  const map = useMap();
  const signature = markers
    .map(
      (marker) =>
        `${marker.point.lat.toFixed(4)},${marker.point.lng.toFixed(4)},${marker.weight ?? 0.6}`,
    )
    .join('|');

  useEffect(() => {
    if (!enabled || markers.length === 0) return;
    const points: Array<[number, number, number]> = markers.map((marker) => [
      marker.point.lat,
      marker.point.lng,
      marker.weight ?? 0.6,
    ]);
    const layer = L.heatLayer(points, {
      radius: 28,
      blur: 22,
      maxZoom: 17,
    });
    map.addLayer(layer);
    return () => {
      map.removeLayer(layer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature encodes markers
  }, [map, enabled, signature]);

  return null;
}

interface RouteLayerProps {
  route: RouteResult | null;
}

export function RouteLayerEffect({ route }: RouteLayerProps) {
  const map = useMap();
  const signature = route
    ? `${route.distanceMeters}:${route.durationSeconds}:${route.geometry.length}`
    : 'none';

  useEffect(() => {
    if (!route || route.geometry.length < 2) return;
    const latLngs = route.geometry.map((point) => [point.lat, point.lng] as [number, number]);
    const polyline = L.polyline(latLngs, {
      color: '#FF4F1A',
      weight: 4,
      opacity: 0.9,
    });
    map.addLayer(polyline);
    return () => {
      map.removeLayer(polyline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature encodes route
  }, [map, signature]);

  return null;
}
