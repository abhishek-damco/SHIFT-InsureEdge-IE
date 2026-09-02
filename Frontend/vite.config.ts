import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-render-redirects',
      closeBundle() {
        fs.copyFileSync('_redirects', 'dist/_redirects');
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
