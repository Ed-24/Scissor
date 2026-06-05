import { defineConfig } from "vitest/config"
import { createRequire } from "node:module"
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
process.env.NAPI_RS_FORCE_WASI = "1"
const require = createRequire(import.meta.url)

export default defineConfig(() => {
  const tailwindcss = require("@tailwindcss/vite").default

  return {
    plugins: [react(), tailwindcss()],
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
    },
  }
})
