import { AppError } from '@/shared/types/errors';

const cache = new Map<string, { expiresAt: number; value: unknown }>();

export function cacheGet<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  if (cache.size > 200) {
    const first = cache.keys().next().value;
    if (typeof first === 'string') cache.delete(first);
  }
}

export async function mapsFetchJson<T>(
  url: string,
  init: RequestInit & { errorCode: string },
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } catch (error) {
    throw new AppError({
      message: error instanceof Error ? error.message : 'Network request failed',
      code: init.errorCode,
    });
  }

  if (!response.ok) {
    throw new AppError({
      message: `Maps request failed (${response.status})`,
      code: init.errorCode,
      status: response.status,
    });
  }

  return (await response.json()) as T;
}
