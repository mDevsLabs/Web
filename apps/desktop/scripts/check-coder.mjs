// Refuser un installateur incomplet au lieu d'annoncer Coder sans l'embarquer.
import { existsSync } from "node:fs";
import path from "node:path";

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
}
