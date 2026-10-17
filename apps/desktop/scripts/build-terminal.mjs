// Le renderer et les styles sont locaux et empaquetés, sans CDN.
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { build } from "esbuild";
const require = createRequire(import.meta.url);
await mkdir("dist/terminal", { recursive: true });
await build({ entryPoints: ["src/terminal/renderer.ts"], outfile: "dist/terminal/terminal.js",
  bundle: true, platform: "browser", format: "iife", target: "chrome130", minify: true });
await copyFile("src/terminal/index.html", "dist/terminal/index.html");
const xtermCss = require.resolve("@xterm/xterm/css/xterm.css");
await writeFile("dist/terminal/terminal.css",
  await readFile(xtermCss, "utf8") + "\n" + await readFile("src/terminal/style.css", "utf8"));
