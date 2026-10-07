import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isWatch = process.argv.includes("--watch");

const ctx = await esbuild.context({
  bundle: true,
  define: {
    "process.env.NODE_ENV": isWatch ? '"development"' : '"production"',
  },
  entryPoints: [path.join(__dirname, "main-src", "index.ts")],
  external: [
    "electron",
    "electron-updater",
    "node-pty",
    // Keep native image processing external so electron-builder can package
    // the matching platform binaries instead of bundling sharp's JS loader.
    "sharp",
    "ssh2",
    "ssh2-sftp-client",
    "cpu-features",
    "chokidar",
    "fsevents",
    "better-sqlite3",
    // Playwright 携带可选依赖（chromium-bidi 等）和动态 require，
    // 不能 bundle，必须从 node_modules 在运行时加载。
    "playwright-core",
  ],
  format: "cjs",
  logLevel: "info",
  minify: !isWatch,
  outfile: path.join(__dirname, "electron", "main.bundle.cjs"),
  packages: "external",
  platform: "node",
  sourcemap: isWatch ? true : "external",
  target: "node22",
});

if (isWatch) {
  await ctx.watch();
  console.log("[esbuild] watching main-src → electron/main.bundle.cjs");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log("[esbuild] built electron/main.bundle.cjs");
}
