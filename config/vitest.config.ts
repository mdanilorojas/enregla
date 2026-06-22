import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(__dirname, '../tests/setup.ts')],
    include: [
      path.resolve(__dirname, '../tests/**/*.test.{ts,tsx}').replace(/\\/g, '/'),
      // src/**: tests colocados junto al código (antes excluidos silenciosamente)
      path.resolve(__dirname, '../src/**/*.test.{ts,tsx}').replace(/\\/g, '/'),
    ],
    css: false,
  },
})
