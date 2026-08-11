import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios';
import { appConfig } from '@/app/config/env';
import { AppError } from '@/shared/types/errors';

const isDev = import.meta.env.DEV;

function createPlatziClient(): AxiosInstance {
  const client = axios.create({
    baseURL: appConfig.platziApiUrl,
    timeout: 20_000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use((config) => {
    if (isDev) {
      const method = (config.method ?? 'get').toUpperCase();
      const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
      console.debug(`[platzi] ${method} ${url}`, config.params ?? {});
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      if (isDev) {
        console.debug(`[platzi] ← ${response.status} ${response.config.url}`);
      }
      return response;
    },
    (error: AxiosError) => {
      const status = error.response?.status;
      const message =
        typeof error.response?.data === 'object' &&
        error.response.data !== null &&
        'message' in error.response.data &&
        typeof (error.response.data as { message: unknown }).message === 'string'
          ? (error.response.data as { message: string }).message
          : error.message || 'Platzi API request failed';

      throw new AppError({
        message,
        code: status === 404 ? 'NOT_FOUND' : 'PLATZI_HTTP_ERROR',
        status,
        details: error.response?.data,
      });
    },
  );

  return client;
}

export const platziClient = createPlatziClient();

export async function platziRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await platziClient.request<T>(config);
  return response.data;
}
