import path from "node:path";

import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  test: {
    // Only DATABASE_URL is exposed to tests (needed by the real-DB integration
    // test). Other secrets (ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, ...) stay
    // unset so unit tests keep exercising their "missing key" fallback paths
    // instead of accidentally making real, billable API calls.
    env: { DATABASE_URL: loadEnv(mode, process.cwd(), "").DATABASE_URL },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
