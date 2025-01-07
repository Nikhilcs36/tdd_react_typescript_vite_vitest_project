import { defineConfig, UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: "./src/tests/setup.ts"
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8080/',
          changeOrigin: true,
        },
      },
    },
}as UserConfig)

// fixed TypeScript doesn't recognize the test property in the Vite configuration ( solution https://stackoverflow.com/a/79028899)  