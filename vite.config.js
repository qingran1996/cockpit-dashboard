import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/')) return 'three-vendor'
          if (id.includes('/node_modules/echarts/') || id.includes('/node_modules/zrender/')) return 'echarts-vendor'
          return undefined
        },
      },
    },
  },
  server: {
    host: true,
    port: 5180,
  },
})
