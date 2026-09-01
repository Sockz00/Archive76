/**
 * TanStack Query provider for the Archive76 frontend.
 *
 * Wraps the application root with a `QueryClient` and `QueryClientProvider`.
 * The client is configured for a local-first desktop app: short stale times
 * for catalogue data (which rarely changes during a session) and aggressive
 * caching to avoid unnecessary Tauri invokes.
 */

import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Singleton QueryClient — created once and reused across the app's lifetime.
// In a Tauri desktop app there's only one window, so a module-level instance
// is safe and avoids re-creating clients (and their cache) on re-renders.
let queryClient: QueryClient | null = null;

function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // No retries on the local backend — a failed Tauri invoke is a real
          // error (not a transient network issue), so retrying just adds latency.
          retry: false,
          // Keep cached data for 5 minutes after the last observer unmounts.
          gcTime: 5 * 60 * 1000,
          // Stale after 30 seconds by default — catalogue data is mostly static.
          staleTime: 30_000,
        },
      },
    });
  }
  return queryClient;
}

export interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps): React.ReactElement {
  const client = React.useMemo(getQueryClient, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
