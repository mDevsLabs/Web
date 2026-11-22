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
    exclude: ["node_modules", "dist", "release", "e2e"],
    pool: "forks",
    projects: [
      {
        extends: true,
        test: {
          environment: "node",
          include: ["main-src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          environment: "jsdom",
          include: ["src/**/*.test.ts"],
        },
      },
    ],
    setupFiles: [],
  },
});
