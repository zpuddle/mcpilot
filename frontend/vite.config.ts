import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8020',
        changeOrigin: true,
        ws: true,
        autoRewrite: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            if ([301, 302, 307, 308].includes(proxyRes.statusCode as number)) {
              const location = proxyRes.headers.location
              if (location && location.includes('://localhost:8020')) {
                proxyRes.headers.location = location.replace(
                  /https?:\/\/localhost:8020/g,
                  `http://localhost:3000`
                )
              }
            }
          })
        },
      },
    },
  },
})
