#!/usr/bin/env node
/**
 * Génère les icônes mobiles depuis public/logo.png
 * - resources/icon.png (1024 source pour capacitor-assets)
 * - resources/splash.png (2732x2732 fond #0a0a0a)
 * - www/icon.png (copie pour fallback Web)
 * Fallback pur-JS : copie simple. Si `sharp` dispo : resize propre + splash.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mobileRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(mobileRoot, "../..");
const srcPng = path.join(repoRoot, "public", "logo.png");
const resourcesDir = path.join(mobileRoot, "resources");
const wwwDir = path.join(mobileRoot, "www");

function ensureDirs() {
  fs.mkdirSync(resourcesDir, { recursive: true });
  fs.mkdirSync(wwwDir, { recursive: true });
}

async function trySharp(pngBuffer) {
  try {
    const sharp = (await import("sharp")).default;
    console.log("[mobile-icons] sharp détecté – génération optimisée");
    // icon 1024 requis par capacitor-assets / stores
    const icon1024 = await sharp(pngBuffer)
      .resize(1024, 1024, {
        background: { alpha: 0, b: 0, g: 0, r: 0 },
        fit: "contain",
      })
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(resourcesDir, "icon.png"), icon1024);
    fs.writeFileSync(path.join(resourcesDir, "icon-only.png"), icon1024);
    fs.writeFileSync(path.join(wwwDir, "icon.png"), icon1024);
    console.log("[mobile-icons] icon.png 1024 généré");

    // splash 2732x2732 fond #0a0a0a + logo centré ~ 800px
    const logo800 = await sharp(pngBuffer)
      .resize(800, 800, {
        background: { alpha: 0, b: 0, g: 0, r: 0 },
        fit: "contain",
      })
      .png()
      .toBuffer();
    const splash = await sharp({
      create: {
        background: { alpha: 1, b: 10, g: 10, r: 10 },
        channels: 4,
        height: 2732,
        width: 2732,
      },
    })
      .composite([{ gravity: "centre", input: logo800 }])
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(resourcesDir, "splash.png"), splash);
    console.log("[mobile-icons] splash.png 2732 généré");
    return true;
  } catch (e) {
    if (e.code !== "ERR_MODULE_NOT_FOUND") {
      console.warn("[mobile-icons] sharp non utilisé:", e.message);
    }
    return false;
  }
}

function patchNativeIcons(iconPngPath) {
  const _iconBuf = fs.readFileSync(iconPngPath);
  // Android : patch mipmap si android/ existe
  const androidRes = path.join(
    mobileRoot,
    "android",
    "app",
    "src",
    "main",
    "res"
  );
  if (fs.existsSync(androidRes)) {
    const densities = [
      "mipmap-hdpi",
      "mipmap-mdpi",
      "mipmap-xhdpi",
      "mipmap-xxhdpi",
      "mipmap-xxxhdpi",
    ];
    for (const d of densities) {
      const dir = path.join(androidRes, d);
      fs.mkdirSync(dir, { recursive: true });
      for (const name of [
        "ic_launcher.png",
        "ic_launcher_round.png",
        "ic_launcher_foreground.png",
      ]) {
        const dst = path.join(dir, name);
        try {
          fs.copyFileSync(iconPngPath, dst);
        } catch {}
      }
    }
    console.log(
      `[mobile-icons] Android mipmap patché (${densities.length} densités)`
    );
  } else {
    console.log("[mobile-icons] Android non trouvé – skip patch");
  }

  // iOS : patch AppIcon si ios/ existe
  const iosIconSet = path.join(
    mobileRoot,
    "ios",
    "App",
    "App",
    "Assets.xcassets",
    "AppIcon.appiconset"
  );
  if (fs.existsSync(iosIconSet)) {
    const files = fs.readdirSync(iosIconSet).filter((f) => f.endsWith(".png"));
    for (const f of files) {
      try {
        fs.copyFileSync(iconPngPath, path.join(iosIconSet, f));
      } catch {}
    }
    // Aussi splash si présent
    const iosSplash = path.join(
      mobileRoot,
      "ios",
      "App",
      "App",
      "Assets.xcassets",
      "Splash.imageset"
    );
    if (fs.existsSync(iosSplash)) {
      const sFiles = fs
        .readdirSync(iosSplash)
        .filter((f) => f.endsWith(".png"));
      for (const f of sFiles) {
        try {
          fs.copyFileSync(iconPngPath, path.join(iosSplash, f));
        } catch {}
      }
    }
    console.log(`[mobile-icons] iOS AppIcon patché (${files.length} fichiers)`);
  } else {
    console.log("[mobile-icons] iOS non trouvé – skip patch");
  }
}

async function main() {
  ensureDirs();
  if (!fs.existsSync(srcPng)) {
    console.error(`[mobile-icons] source introuvable: ${srcPng}`);
    process.exit(1);
  }
  const pngBuffer = fs.readFileSync(srcPng);
  console.log(`[mobile-icons] source: ${srcPng} (${pngBuffer.length} bytes)`);

  const sharpOk = await trySharp(pngBuffer);
  if (!sharpOk) {
    // Fallback : copie brute du logo comme icon + splash (capacitor-assets accepte, stores scalent)
    const dstIcon = path.join(resourcesDir, "icon.png");
    fs.copyFileSync(srcPng, dstIcon);
    console.log(`[mobile-icons] icon.png copié (fallback) -> ${dstIcon}`);

    const dstSplash = path.join(resourcesDir, "splash.png");
    fs.copyFileSync(srcPng, dstSplash);
    console.log(`[mobile-icons] splash.png copié (fallback) -> ${dstSplash}`);

    const dstWwwIcon = path.join(wwwDir, "icon.png");
    fs.copyFileSync(srcPng, dstWwwIcon);
    console.log(`[mobile-icons] www/icon.png copié -> ${dstWwwIcon}`);
  }

  // Patch natif si dossiers existent (après `npx cap add`)
  const generatedIcon = path.join(resourcesDir, "icon.png");
  if (fs.existsSync(generatedIcon)) {
    try {
      patchNativeIcons(generatedIcon);
    } catch (e) {
      console.warn("[mobile-icons] patch natif échec:", e.message);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
