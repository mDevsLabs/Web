// Refuser un installateur incomplet au lieu d'annoncer Coder sans l'embarquer.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

function hasNativeModule(root) {
  if (!existsSync(root)) return false;
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".node")) return true;
      if (entry.isDirectory()) stack.push(path.join(current, entry.name));
    }
  }
  return false;
}

export default function checkCoder(context) {
  const arch = { 1: "x64", 3: "arm64" }[context.arch];
  const relative = {
    win32: "mAI Coder.exe",
    darwin: "mAI Coder.app/Contents/MacOS/mAI Coder",
    linux: "mai-coder",
  }[context.electronPlatformName];
  const coderDir = path.join(context.packager.projectDir, `build/coder-${arch}`);
  if (!arch || !relative || !existsSync(path.join(coderDir, relative))) {
    throw new Error(`Coder ${context.electronPlatformName}/${arch} est absent. Exécutez pnpm run prepare:coder ${arch || ""}.`);
  }
  const asarPath = context.electronPlatformName === "darwin"
    ? path.join(coderDir, "mAI Coder.app/Contents/Resources/app.asar")
    : path.join(coderDir, "resources/app.asar");
  if (!existsSync(asarPath)) {
    throw new Error(`Le paquet app.asar de Coder (${context.electronPlatformName}/${arch}) est manquant dans ${coderDir}.`);
  }
  // Les modules natifs (node-pty, better-sqlite3) vivent hors de l'asar. Sans
  // `app.asar.unpacked`, Coder démarre puis meurt sur un `require` manquant :
  // le paquet doit être refusé ici, pas livré.
  const unpackedRoot = context.electronPlatformName === "darwin"
    ? path.join(coderDir, "mAI Coder.app/Contents/Resources/app.asar.unpacked")
    : path.join(coderDir, "resources/app.asar.unpacked");
  if (!hasNativeModule(unpackedRoot)) {
    throw new Error(
      `Les modules natifs de Coder (${context.electronPlatformName}/${arch}) sont absents de ${unpackedRoot}. Relancez pnpm run prepare:coder ${arch || ""}.`
    );
  }
  // Un payload préparé avant un changement de version ne doit pas être embarqué
  // silencieusement : mAI exécuterait une autre version que celle annoncée.
  const markerPath = path.join(coderDir, "coder-version.json");
  if (!existsSync(markerPath)) {
    throw new Error(`Le marqueur de version de Coder est manquant dans ${coderDir}. Relancez pnpm run prepare:coder ${arch || ""}.`);
  }
  const marker = JSON.parse(readFileSync(markerPath, "utf8"));
  const coderPackage = JSON.parse(
    readFileSync(path.resolve(context.packager.projectDir, "../coder/package.json"), "utf8")
  );
  if (marker.version !== coderPackage.version) {
    throw new Error(
      `Coder embarqué en ${marker.version} alors que la source est en ${coderPackage.version}. Relancez pnpm run prepare:coder ${arch || ""}.`
    );
  }
}
