import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const buildEnv = loadEnv(mode, process.cwd(), '');
  if (mode === 'production' && buildEnv.VITE_APP_ENV === 'production' && (buildEnv.VITE_USE_MOCKS === 'true' || buildEnv.VITE_DEMO_MODE === 'true' || Boolean(buildEnv.VITE_DEMO_PASSWORD))) {
    throw new Error('Production build blocked: mocks and demo mode must be off and VITE_DEMO_PASSWORD must be empty.');
  }
  return {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
    server: { host: '0.0.0.0', port: 5175, strictPort: true, allowedHosts: true },
    build: { sourcemap: false },
    test: { environment: 'jsdom', setupFiles: './src/test-setup.ts' }
  };
});
