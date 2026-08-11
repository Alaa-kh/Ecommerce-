import { useCallback, useState } from 'react';
import type { GeoPoint } from '@/shared/services/maps';
import { AppError, toAppError } from '@/shared/types/errors';

export type UserLocationStatus = 'idle' | 'loading' | 'success' | 'error';

export function useUserLocation() {
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [status, setStatus] = useState<UserLocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setStatus('loading');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPoint({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStatus('success');
      },
      (err) => {
        setPoint(null);
        setStatus('error');
        setError(
          toAppError(
            new AppError({
              message: err.message || 'Unable to read your location',
              code: 'GEOLOCATION_FAILED',
            }),
          ).message,
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30_000 },
    );
  }, []);

  return { point, status, error, locate };
}
