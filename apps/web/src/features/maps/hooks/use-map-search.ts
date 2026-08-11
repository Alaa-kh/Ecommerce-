import { useCallback, useEffect, useRef, useState } from 'react';
import { geocodingService, type GeocodeResult } from '@/shared/services/maps';
import { toAppError } from '@/shared/types/errors';

export type MapSearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export function useMapSearch(language: string, debounceMs = 400) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [status, setStatus] = useState<MapSearchStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    abortRef.current?.abort();

    const handle = window.setTimeout(() => {
      if (trimmed.length < 2) {
        setResults([]);
        setStatus('idle');
        setError(null);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setStatus('loading');
      setError(null);

      void geocodingService
        .search(trimmed, { language, limit: 6, signal: controller.signal })
        .then((items) => {
          if (controller.signal.aborted) return;
          setResults(items);
          setStatus(items.length === 0 ? 'empty' : 'success');
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setResults([]);
          setStatus('error');
          setError(toAppError(err).message);
        });
    }, trimmed.length < 2 ? 0 : debounceMs);

    return () => {
      window.clearTimeout(handle);
    };
  }, [query, language, debounceMs]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setStatus('idle');
    setError(null);
  }, []);

  return { query, setQuery, results, status, error, clear };
}
