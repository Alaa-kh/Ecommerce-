import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isValidGeoPoint,
  routingService,
  type GeoPoint,
  type RouteResult,
} from '@/shared/services/maps';
import { toAppError } from '@/shared/types/errors';

export type RouteStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export function useRoute(from: GeoPoint | null, to: GeoPoint | null) {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [status, setStatus] = useState<RouteStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fromLat = from?.lat;
  const fromLng = from?.lng;
  const toLat = to?.lat;
  const toLng = to?.lng;

  useEffect(() => {
    abortRef.current?.abort();

    const handle = window.setTimeout(() => {
      const origin =
        fromLat != null && fromLng != null ? { lat: fromLat, lng: fromLng } : null;
      const destination =
        toLat != null && toLng != null ? { lat: toLat, lng: toLng } : null;

      if (!isValidGeoPoint(origin) || !isValidGeoPoint(destination)) {
        setRoute(null);
        setStatus('idle');
        setError(null);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setStatus('loading');
      setError(null);

      void routingService
        .route(origin, destination, {
          signal: controller.signal,
          profile: 'driving',
        })
        .then((result) => {
          if (controller.signal.aborted) return;
          setRoute(result);
          setStatus(result.geometry.length > 0 ? 'success' : 'empty');
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setRoute(null);
          setStatus('error');
          setError(toAppError(err).message);
        });
    }, 300);

    return () => window.clearTimeout(handle);
  }, [fromLat, fromLng, toLat, toLng]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const clear = useCallback(() => {
    setRoute(null);
    setStatus('idle');
    setError(null);
  }, []);

  return { route, status, error, clear };
}
