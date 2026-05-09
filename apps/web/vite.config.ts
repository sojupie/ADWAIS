import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@types': resolve(__dirname, '../../packages/types/index.ts'),
      '@utils': resolve(__dirname, '../../packages/utils/index.ts'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false, // Allow self-signed dev certs
      },
    },
  },
})
