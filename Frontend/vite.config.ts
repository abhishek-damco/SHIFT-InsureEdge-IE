import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-render-redirects',
      closeBundle() {
        fs.copyFileSync(
          new URL('./_redirects', import.meta.url),
          new URL('./dist/_redirects', import.meta.url),
        );
      },
    },
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
