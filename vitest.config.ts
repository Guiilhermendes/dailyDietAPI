import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    threads: false,
    maxConcurrency: 1,
    isolate: true,
  },
})
