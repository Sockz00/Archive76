/// <reference types="vitest/globals" />

import { defineConfig } from 'vite';

/**
 * Vitest configuration for the Archive76 frontend.
 *
 * Tests run in a jsdom environment (browser-like DOM) so we can use
 * @testing-library/react for component rendering and interaction tests.
 * The `@/` alias from vite.config.ts is inherited here since vitest
 * uses the same Vite config resolution.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/lib/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    mockReset: true,
  },
});
