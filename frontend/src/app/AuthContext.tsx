import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { UserSession } from '@aptohire/university-backend';
import { useBackend } from './BackendProvider';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext<{ user: UserSession | null; loading: boolean; refresh: () => Promise<void>; signOut: (scope?: 'local' | 'global') => Promise<void> } | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const backend = useBackend(); const queryClient = useQueryClient();
  const [user, setUser] = useState<UserSession | null>(null); const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { setLoading(true); try { setUser(await backend.auth.getSession()); } finally { setLoading(false); } }, [backend]);
  useEffect(() => { void refresh(); }, [refresh]);
  const signOut = useCallback(async (scope: 'local' | 'global' = 'local') => { await backend.auth.signOut(scope); queryClient.clear(); setUser(null); }, [backend, queryClient]);
  const value = useMemo(() => ({ user, loading, refresh, signOut }), [user, loading, refresh, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider is missing.'); return value; }
