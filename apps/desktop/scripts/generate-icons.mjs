#!/usr/bin/env node
/**
 * Génère les icônes Electron à partir de public/logo.png (676x676)
 * - build/icon.png  (copie)
 * - build/icon.ico  (ICO contenant PNG – valide Windows Vista+)
 * - build/icon.icns (ICNS contenant PNG – valide macOS 10.7+)
 *
 * Pas de dépendance native : embedding PNG direct.
 * Si `sharp` est disponible, on tentera une génération multi-résolution propre.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const desktopRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(desktopRoot, "../..");
const srcPng = path.join(repoRoot, "public", "logo.png");
const buildDir = path.join(desktopRoot, "build");

const dstPng = path.join(buildDir, "icon.png");
const dstIco = path.join(buildDir, "icon.ico");
const dstIcns = path.join(buildDir, "icon.icns");

function ensureBuildDir() {
  fs.mkdirSync(buildDir, { recursive: true });
}

function createIcoFromPng(pngBuffer) {
  // ICO avec 1 image PNG embed (Windows supporte PNG dans ICO depuis Vista)
  // Header 6 bytes + DirEntry 16 bytes + png
  const count = 1;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type ICO
  header.writeUInt16LE(count, 4);

  const entry = Buffer.alloc(16);
  // Pour 256+ on met 0 ; on déclare 256 pour rester valide, OS scalera
  entry[0] = 0; // width 0 = 256
  entry[1] = 0; // height 0 = 256
  entry[2] = 0; // colorCount
  entry[3] = 0; // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bitCount
  entry.writeUInt32LE(pngBuffer.length, 8); // bytesInRes
  entry.writeUInt32LE(6 + 16 * count, 12); // imageOffset

  return Buffer.concat([header, entry, pngBuffer]);
}

function createIcoMultiFromPng(pngBuffer) {
  // Génère un ICO multi-résolutions mais avec le même PNG pour chaque entrée
  // Windows choisira la meilleure et scalera. C'est préférable à 1 seule entrée pour compatibilité.
  const sizes = [16, 32, 48, 256];
  const count = sizes.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const off = i * 16;
    entries[off] = size === 256 ? 0 : size;
    entries[off + 1] = size === 256 ? 0 : size;
    entries[off + 2] = 0;
    entries[off + 3] = 0;
    entries.writeUInt16LE(1, off + 4);
    entries.writeUInt16LE(32, off + 6);
    entries.writeUInt32LE(pngBuffer.length, off + 8);
    entries.writeUInt32LE(offset, off + 12);
    offset += pngBuffer.length; // chaque entrée pointe vers une copie du PNG (on dupliquera)
  }
  // On concatène le header + entries + N * pngBuffer
  const pngs = Buffer.alloc(pngBuffer.length * count);
  for (let i = 0; i < count; i++) {
    pngBuffer.copy(pngs, i * pngBuffer.length);
  }
  return Buffer.concat([header, entries, pngs]);
}

function createIcnsFromPng(pngBuffer) {
  // ICNS minimal valide : header 'icns' + 1 entrée 'ic09' (512x512 PNG)
  // macOS >= 10.7 supporte PNG dans ICNS
  const type = "ic09"; // 512x512
  const iconLen = 8 + pngBuffer.length;
  const fileLen = 8 + iconLen;
  const buf = Buffer.alloc(fileLen);
  buf.write("icns", 0, "ascii");
  buf.writeUInt32BE(fileLen, 4);
  buf.write(type, 8, "ascii");
  buf.writeUInt32BE(iconLen, 12);
  pngBuffer.copy(buf, 16);
  return buf;
}

function createIcnsMultiFromPng(pngBuffer) {
  // Multi-entrées pour meilleure compatibilité Retina, mais même PNG
  const types = ["icp4", "icp5", "ic07", "ic08", "ic09"]; // 16,32,128,256,512
  let totalIconsLen = 0;
  for (const _t of types) {
    totalIconsLen += 8 + pngBuffer.length;
  }
  const fileLen = 8 + totalIconsLen;
  const buf = Buffer.alloc(fileLen);
  buf.write("icns", 0, "ascii");
  buf.writeUInt32BE(fileLen, 4);
  let off = 8;
  for (const t of types) {
    const iconLen = 8 + pngBuffer.length;
    buf.write(t, off, "ascii");
    buf.writeUInt32BE(iconLen, off + 4);
    pngBuffer.copy(buf, off + 8);
    off += iconLen;
  }
  return buf;
}

async function trySharpGeneration(pngBuffer) {
  try {
    const sharp = (await import("sharp")).default;
    console.log(
      "[icons] sharp détecté – génération multi-résolutions optimale"
    );
    // Génère des PNG redimensionnés propres puis embed
    const sizes = [16, 32, 48, 256, 512];
    const pngs = {};
    for (const s of sizes) {
      pngs[s] = await sharp(pngBuffer)
        .resize(s, s, {
          background: { alpha: 0, b: 0, g: 0, r: 0 },
          fit: "contain",
        })
        .png()
        .toBuffer();
    }
    // ICO avec vraies tailles
    {
      const count = 4; // 16,32,48,256
      const icoSizes = [16, 32, 48, 256];
      const header = Buffer.alloc(6);
      header.writeUInt16LE(0, 0);
      header.writeUInt16LE(1, 2);
      header.writeUInt16LE(count, 4);
      const entries = Buffer.alloc(16 * count);
      let offset = 6 + 16 * count;
      const datas = [];
      for (let i = 0; i < count; i++) {
        const s = icoSizes[i];
        const b = pngs[s];
        datas.push(b);
        entries[i * 16] = s === 256 ? 0 : s;
        entries[i * 16 + 1] = s === 256 ? 0 : s;
        entries[i * 16 + 2] = 0;
        entries[i * 16 + 3] = 0;
        entries.writeUInt16LE(1, i * 16 + 4);
        entries.writeUInt16LE(32, i * 16 + 6);
        entries.writeUInt32LE(b.length, i * 16 + 8);
        entries.writeUInt32LE(offset, i * 16 + 12);
        offset += b.length;
      }
      const ico = Buffer.concat([header, entries, ...datas]);
      fs.writeFileSync(dstIco, ico);
      console.log(`[icons] icon.ico généré via sharp (${ico.length} bytes)`);
    }
    // ICNS avec vraies tailles
    {
      const mapping = [
        { size: 16, type: "icp4" },
        { size: 32, type: "icp5" },
        { size: 128, type: "ic07" },
        { size: 256, type: "ic08" },
        { size: 512, type: "ic09" },
      ];
      // Génère 128 via sharp si pas déjà fait
      if (!pngs[128]) {
        pngs[128] = await sharp(pngBuffer).resize(128, 128).png().toBuffer();
      }
      let total = 8;
      for (const m of mapping) {
        total += 8 + pngs[m.size].length;
      }
      const buf = Buffer.alloc(total);
      buf.write("icns", 0);
      buf.writeUInt32BE(total, 4);
      let off2 = 8;
      for (const m of mapping) {
        const b = pngs[m.size];
        buf.write(m.type, off2);
        buf.writeUInt32BE(8 + b.length, off2 + 4);
        b.copy(buf, off2 + 8);
        off2 += 8 + b.length;
      }
      fs.writeFileSync(dstIcns, buf);
      console.log(`[icons] icon.icns généré via sharp (${buf.length} bytes)`);
    }
    // PNG principal 512
    fs.writeFileSync(dstPng, pngs[512]);
    console.log("[icons] icon.png (512) généré via sharp");
    return true;
  } catch (e) {
    if (e.code !== "ERR_MODULE_NOT_FOUND") {
      console.warn("[icons] sharp non utilisé:", e.message);
    }
    return false;
  }
}

async function main() {
  ensureBuildDir();
  if (!fs.existsSync(srcPng)) {
    console.error(`[icons] source introuvable: ${srcPng}`);
    process.exit(1);
  }
  const pngBuffer = fs.readFileSync(srcPng);
  console.log(`[icons] source: ${srcPng} (${pngBuffer.length} bytes)`);

  // Copie PNG de base (on écrase après sharp si dispo)
  fs.copyFileSync(srcPng, dstPng);
  console.log(
    `[icons] icon.png copié (${pngBuffer.length} bytes) -> ${dstPng}`
  );

  // Tente sharp d'abord
  const sharpOk = await trySharpGeneration(pngBuffer);
  if (sharpOk) {
    console.log("[icons] génération terminée (sharp)");
    return;
  }

  // Fallback pure-JS : embed PNG direct
  const ico = createIcoMultiFromPng(pngBuffer);
  fs.writeFileSync(dstIco, ico);
  console.log(
    `[icons] icon.ico généré (fallback embed PNG x${4}) -> ${dstIco} (${ico.length} bytes)`
  );

  const icns = createIcnsMultiFromPng(pngBuffer);
  fs.writeFileSync(dstIcns, icns);
  console.log(
    `[icons] icon.icns généré (fallback embed PNG x5) -> ${dstIcns} (${icns.length} bytes)`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
