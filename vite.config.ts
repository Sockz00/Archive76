import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// M2 scaffold: Vite dev server fronts the Tauri window at localhost:5173.
// In production (Tauri build), the `distDir` in tauri.conf.json points here.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Tauri expects the dev server reachable from the native shell.
    host: 'localhost',
    port: 5173,
  },
  // Avoid emitting source maps in production builds to keep bundle lean.
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
