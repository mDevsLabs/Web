/**
 * Rasterize docs/assets/*-screenshot.svg and async-model-settings.svg to PNG for GitHub README.
 * GitHub often fails to load SVG in README <img>; PNG is reliable.
 * Run: npm run readme:screenshots
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const assets = path.join(root, "docs", "assets");

const sharp = (await import("sharp")).default;

const pairs = [
  ["async-editor-screenshot.svg", "async-editor-screenshot.png"],
  ["async-agent-screenshot.svg", "async-agent-screenshot.png"],
  ["async-model-settings.svg", "async-model-settings.png"],
];

for (const [svgName, pngName] of pairs) {
  const svgPath = path.join(assets, svgName);
  const pngPath = path.join(assets, pngName);
  const buf = await readFile(svgPath);
  await sharp(buf).png({ compressionLevel: 9 }).toFile(pngPath);
  console.log("[export-readme-screenshots] wrote", pngPath);
}
