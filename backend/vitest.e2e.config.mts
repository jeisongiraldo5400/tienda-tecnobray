import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/** Pruebas e2e contra Postgres y MinIO de docker-compose (perfil "test"). */
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    setupFiles: ['test/setup-env.ts'],
    globalSetup: ['test/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 120000,
  },
});
