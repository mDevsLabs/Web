import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@resources": path.resolve(__dirname, "resources"),
    },
  },
  test: {
    environment: "node",
    environmentMatchGlobs: [["src/**/*.test.{ts,tsx}", "jsdom"]],
    exclude: ["node_modules", "dist", "release", "e2e"],
    include: ["main-src/**/*.test.ts", "src/**/*.test.ts"],
    pool: "forks",
    setupFiles: [],
  },
});
