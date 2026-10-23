import { z } from 'zod';

const raw = {
  appEnv: import.meta.env.VITE_APP_ENV ?? 'local',
  demoMode: import.meta.env.VITE_DEMO_MODE ?? 'true',
  useMocks: import.meta.env.VITE_USE_MOCKS ?? 'true',
  siteUrl: import.meta.env.VITE_SITE_URL ?? 'http://localhost:5175',
  rootUrl: import.meta.env.VITE_ROOT_URL ?? 'http://localhost:5173',
  rootDomain: import.meta.env.VITE_ROOT_DOMAIN ?? 'localhost',
  studentUrl: import.meta.env.VITE_STUDENT_URL ?? 'http://localhost:5174',
  organizationUrl: import.meta.env.VITE_ORGANIZATION_URL ?? 'http://localhost:5176',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  demoPassword: import.meta.env.VITE_DEMO_PASSWORD ?? '',
  rosterMaxMb: import.meta.env.VITE_ROSTER_MAX_MB ?? '5',
  rosterMaxRows: import.meta.env.VITE_ROSTER_MAX_ROWS ?? '10000',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL ?? 'support@aptohire.test'
};
const schema = z.object({
  appEnv: z.enum(['local', 'demo', 'production']),
  demoMode: z.enum(['true', 'false']).transform((value) => value === 'true'),
  useMocks: z.enum(['true', 'false']).transform((value) => value === 'true'),
  siteUrl: z.string().url(), rootUrl: z.string().url(), rootDomain: z.string().min(1),
  studentUrl: z.string().url(), organizationUrl: z.string().url(),
  supabaseUrl: z.string(), supabaseAnonKey: z.string(), demoPassword: z.string(),
  rosterMaxMb: z.coerce.number().positive(), rosterMaxRows: z.coerce.number().int().positive(), supportEmail: z.string().email()
});
export const env = schema.parse(raw);
if (env.appEnv === 'production' && (env.useMocks || env.demoMode || env.demoPassword !== '')) {
  throw new Error('Production config is unsafe: disable demo mode and mocks, and remove the demo password.');
}
if (!env.useMocks && (!env.supabaseUrl || !env.supabaseAnonKey)) {
  throw new Error('Supabase mode needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}
