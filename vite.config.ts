import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  // La API solo permite CORS desde localhost:4200 en desarrollo.
  server: { port: 4200, strictPort: true },
  test: { include: ['src/**/*.test.ts'] },
})
