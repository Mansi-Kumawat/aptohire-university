import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

/** One browser client for the university origin. It uses the public anon key and staff JWT only. */
export const supabase = env.useMocks ? null : createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: { storageKey: 'aptohire-university', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
});
