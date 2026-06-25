import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Group management + auth/password-reset → .NET backend
      '/api/groups': { target: 'http://localhost:5000', changeOrigin: true },
      '/api/auth': { target: 'http://localhost:5000', changeOrigin: true },
      '/api/password-reset': { target: 'http://localhost:5000', changeOrigin: true },
      '/api/users/onboarding': { target: 'http://localhost:5000', changeOrigin: true },
      // User management + reference data → Node.js backend
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
})
