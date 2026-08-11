import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let configured = false;

/** Fix default Leaflet marker assets under Vite bundling. */
export function ensureLeafletDefaultIcon(): void {
  if (configured || typeof window === 'undefined') return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
    configured = true;
  } catch {
    // Keep map usable even if default icon patching fails.
  }
}

export function createDeliveryIcon(): L.DivIcon {
  return L.divIcon({
    className: 'lumina-map-pin',
    html: '<span class="lumina-map-pin__dot" aria-hidden="true"></span>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}
