import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createMockBackend, type Backend } from '@aptohire/university-backend';
import { env } from '@/config/env';

const BackendContext = createContext<Backend | null>(null);
export function BackendProvider({ children }: { children: ReactNode }) {
  const [backend,setBackend]=useState<Backend|null>(()=>env.useMocks?createMockBackend():null);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    if(env.useMocks)return;
    let active=true;
    void Promise.all([import('@aptohire/university-backend/supabase'),import('@/lib/supabase/client')]).then(([adapter,module])=>{
      if(!module.supabase)throw new Error('The Supabase browser client is not configured.');
      if(active)setBackend(()=>adapter.createSupabaseBackend(module.supabase!));
    }).catch(()=>{if(active)setFailed(true);});
    return()=>{active=false;};
  },[]);
  if(!backend)return <main className="system-screen" role={failed?'alert':'status'}>{failed?<><h1>We couldn’t connect to the university portal.</h1><p>Check your connection and project settings, then try again.</p><button className="button button-primary" onClick={()=>window.location.reload()}>Try again</button></>:<><span className="spinner" aria-hidden="true"/><p>Connecting to the university portal…</p></>}</main>;
  return <BackendContext.Provider value={backend}>{children}</BackendContext.Provider>;
}
export function useBackend(): Backend {
  const backend = useContext(BackendContext);
  if (!backend) throw new Error('BackendProvider is missing.');
  return backend;
}
