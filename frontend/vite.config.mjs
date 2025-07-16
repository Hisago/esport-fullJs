import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  preview: {
    port: parseInt(process.env.PORT || '4173'),
    host: true,
    allowedHosts: ['.onrender.com'] // 👈 autorise Render
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
