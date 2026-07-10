import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { resolve } from 'node:path'
import basicSsl from "@vitejs/plugin-basic-ssl"

// https://vite.dev
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react(),
    basicSsl()
  ],
  build: {
    target: 'chrome76',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) return 'vendor-charts';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor-react';
          if (id.includes('node_modules/@tanstack')) return 'vendor-router';
          if (id.includes('node_modules/lucide-react')) return 'icons';
        }
      }
    }
  },
  resolve: {
    alias: {
      '@types': resolve(__dirname, '../../packages/types/index.ts'),
      '@utils': resolve(__dirname, '../../packages/utils/index.ts'),
    },
  },
  // CHANGED: The 'server' block only dictates local development behavior.
  server: {
    host: true, // <-- CHANGED: Tells Vite to listen on your local Wi-Fi network (0.0.0.0) so your phone can connect
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5002', // <-- UNCHANGED: Keeps the fast IPv4 loopback for your Windows PC
        changeOrigin: true,
        secure: false,
      },
      '/swagger': {
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
        secure: false,
      },
      '/openapi': {
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
        secure: false,
      },
      '/hangfire': {
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
