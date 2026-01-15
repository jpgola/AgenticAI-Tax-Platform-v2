
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api to backend to avoid CORS in local dev
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000'
    }
  }
})
