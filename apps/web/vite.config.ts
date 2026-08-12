import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** GitHub Pages project site: https://alaa-kh.github.io/Ecommerce-/ */
const pagesBase = process.env.GITHUB_PAGES === 'true' ? '/Ecommerce-/' : '/';

export default defineConfig({
  base: pagesBase,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
    dedupe: ['react', 'react-dom', 'leaflet', 'react-leaflet'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-leaflet',
      'leaflet',
      'leaflet.markercluster',
      'leaflet.heat',
    ],
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
