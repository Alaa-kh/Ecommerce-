import { useCallback, useEffect, useRef, useState } from 'react';
import {
  geocodingService,
  isValidGeoPoint,
  type GeocodeResult,
  type GeoPoint,
} from '@/shared/services/maps';
import { toAppError } from '@/shared/types/errors';

export type ReverseStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export function useReverseGeocode(point: GeoPoint | null, language: string) {
  const [result, setResult] = useState<GeocodeResult | null>(null);
  const [status, setStatus] = useState<ReverseStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lat = point?.lat;
  const lng = point?.lng;

  useEffect(() => {
    abortRef.current?.abort();

    const handle = window.setTimeout(() => {
      if (
        lat == null ||
        lng == null ||
        !isValidGeoPoint({ lat, lng })
      ) {
        setResult(null);
        setStatus('idle');
        setError(null);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setStatus('loading');
      setError(null);

      void geocodingService
        .reverse({ lat, lng }, { language, signal: controller.signal })
        .then((item) => {
          if (controller.signal.aborted) return;
          setResult(item);
          setStatus(item ? 'success' : 'empty');
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setResult(null);
          setStatus('error');
          setError(toAppError(err).message);
        });
    }, 350);

    return () => window.clearTimeout(handle);
  }, [lat, lng, language]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    setResult(null);
    setStatus('idle');
    setError(null);
  }, []);

  return { result, status, error, reset };
}
