import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { store } from '@/app/store';
import { ThemeProvider } from './theme-provider';
import '@/shared/localization/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
          <ThemeProvider>{children}</ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
