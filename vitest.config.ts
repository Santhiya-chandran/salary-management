import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Kept separate from vite.config.ts because the Ruby plugin only matters for
// the Rails build, not for running component tests in jsdom.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['app/frontend/**/*.test.{ts,tsx}'],
    setupFiles: ['./app/frontend/test/setup.ts'],
  },
})
