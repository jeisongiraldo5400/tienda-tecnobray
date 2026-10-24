'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { ApiError } from '@/shared/api/errors';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (count, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return count < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="top-center"
        richColors
        closeButton
        // Los colores "rich" de sonner (verde #008a2e sobre #ecfdf3 = 4.4:1) no cumplen AA: se oscurecen.
        toastOptions={{
          duration: 4000,
          classNames: {
            description: '!text-slate-700 !opacity-100',
            success: '!border-emerald-200 !bg-emerald-50 !text-emerald-900',
            error: '!border-red-200 !bg-red-50 !text-red-800',
          },
        }}
      />
    </QueryClientProvider>
  );
}
