import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development, forward /api calls to the FastAPI server
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': process.env.API_URL ?? 'http://127.0.0.1:8000' },
  },
})
