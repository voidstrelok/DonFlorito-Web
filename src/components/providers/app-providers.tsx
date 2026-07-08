'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoadingProvider } from '@/components/providers/loading-provider';
import { LocaleProvider } from '@/components/providers/locale-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <LoadingProvider>{children}</LoadingProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
