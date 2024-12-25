import { defineConfig, UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: "./src/tests/setup.ts"
    },
}as UserConfig)

// fixed TypeScript doesn't recognize the test property in the Vite configuration ( solution https://stackoverflow.com/a/79028899)  