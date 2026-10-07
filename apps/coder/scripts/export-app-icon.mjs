/**
 * Export and sync application icons:
 * - resources/icons/icon.png (source of truth)
 * - resources/icons/icon.ico
 * - resources/icons/icon.icns (macOS only)
 * - public/favicon.png
 * - public/logo.png
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "resources", "icons");
const outPng = path.join(outDir, "icon.png");
const outIco = path.join(outDir, "icon.ico");
const outIcns = path.join(outDir, "icon.icns");
const publicDir = path.join(root, "public");
const faviconPng = path.join(publicDir, "favicon.png");
const logoPng = path.join(publicDir, "logo.png");

const sharp = (await import("sharp")).default;
const pngToIco = (await import("png-to-ico")).default;

await mkdir(outDir, { recursive: true });
await mkdir(publicDir, { recursive: true });

let appIconPng;
if (existsSync(outPng)) {
  appIconPng = await readFile(outPng);
} else {
  const svgPath = path.join(root, "docs", "assets", "async-logo.svg");
  const svg = await readFile(svgPath);
  const size = 1024;
  const cornerRadius = Math.round(size * 0.156);
  const logoPx = Math.round(size * 0.86);
  const roundedPlateSvg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
			<rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#0c0c0e"/>
		</svg>`
  );
  const plate = await sharp(roundedPlateSvg).ensureAlpha().png().toBuffer();
  const logo = await sharp(svg).resize(logoPx, logoPx).png().toBuffer();
  appIconPng = await sharp(plate)
    .composite([{ gravity: "center", input: logo }])
    .png()
    .toBuffer();
  await writeFile(outPng, appIconPng);
}

// Generate icon.ico if not already present or update
if (!existsSync(outIco)) {
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const icoFrames = await Promise.all(
    icoSizes.map((sizePx) =>
      sharp(appIconPng).resize(sizePx, sizePx).png().toBuffer()
    )
  );
  await writeFile(outIco, await pngToIco(icoFrames));
}

// Sync public/favicon.png and public/logo.png directly from resources/icons/icon.png
await writeFile(faviconPng, appIconPng);
await writeFile(logoPng, appIconPng);

await maybeWriteMacIcon(appIconPng);

console.log(
  "[export-app-icon] synced",
  outPng,
  outIco,
  "and",
  faviconPng,
  logoPng
);

async function maybeWriteMacIcon(appIconBuffer) {
  if (process.platform !== "darwin") {
    return;
  }

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "async-iconset-"));
  const iconsetDir = path.join(tempRoot, "icon.iconset");

  try {
    await mkdir(iconsetDir, { recursive: true });
    await Promise.all([
      writeIconsetPng(iconsetDir, "icon_16x16.png", 16, appIconBuffer),
      writeIconsetPng(iconsetDir, "icon_16x16@2x.png", 32, appIconBuffer),
      writeIconsetPng(iconsetDir, "icon_32x32.png", 32, appIconBuffer),
      writeIconsetPng(iconsetDir, "icon_32x32@2x.png", 64, appIconBuffer),
      writeIconsetPng(iconsetDir, "icon_128x128.png", 128, appIconBuffer),
      writeIconsetPng(iconsetDir, "icon_128x128@2x.png", 256, appIconBuffer),
      writeIconsetPng(iconsetDir, "icon_256x256.png", 256, appIconBuffer),
      writeIconsetPng(iconsetDir, "icon_256x256@2x.png", 512, appIconBuffer),
      writeIconsetPng(iconsetDir, "icon_512x512.png", 512, appIconBuffer),
      writeIconsetPng(iconsetDir, "icon_512x512@2x.png", 1024, appIconBuffer),
    ]);

    const result = spawnSync(
      "iconutil",
      ["-c", "icns", iconsetDir, "-o", outIcns],
      {
        encoding: "utf8",
        stdio: "pipe",
      }
    );
    if (result.status !== 0) {
      const detail =
        result.stderr?.trim() ||
        result.stdout?.trim() ||
        `exit ${result.status ?? "unknown"}`;
      throw new Error(`iconutil failed: ${detail}`);
    }
    console.log("[export-app-icon] wrote", outIcns);
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
}

async function writeIconsetPng(iconsetDir, fileName, sizePx, input) {
  const target = path.join(iconsetDir, fileName);
  await sharp(input).resize(sizePx, sizePx).png().toFile(target);
}
