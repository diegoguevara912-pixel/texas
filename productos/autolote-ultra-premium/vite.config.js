import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  root: 'client',
  publicDir: 'public',
  plugins: [react()],
  resolve: { alias: { '@shared': path.resolve(import.meta.dirname, 'shared') } },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
      '/sitemap.xml': 'http://localhost:3001',
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three';
          if (id.includes('@react-three')) return 'r3f';
          if (id.includes('node_modules/gsap')) return 'gsap';
        },
      },
    },
  },
  test: { root: '.', include: ['tests/**/*.test.js'], environment: 'node' },
});
