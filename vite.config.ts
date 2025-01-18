import { defineConfig, UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    optimizeDeps: {
      esbuildOptions: {
        target: 'es2020',
      },
    },
    esbuild: {
      // https://github.com/vitejs/vite/issues/8644#issuecomment-1159308803
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
    },
    plugins: [react({
      babel: {
        plugins: ['babel-plugin-macros', 'babel-plugin-styled-components'],
      },})],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: "./src/tests/setup.ts",
      //css: true
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