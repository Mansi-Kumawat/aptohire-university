import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { useState, type ReactNode } from 'react';
import { BackendProvider } from './BackendProvider';
import { AuthProvider } from './AuthContext';
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } }));
  return <HelmetProvider><QueryClientProvider client={queryClient}><BackendProvider><AuthProvider>{children}</AuthProvider></BackendProvider></QueryClientProvider></HelmetProvider>;
}
