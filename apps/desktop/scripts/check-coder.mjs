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
  if (!arch || !relative || !existsSync(path.join(context.packager.projectDir, `build/coder-${arch}`, relative))) {
    throw new Error(`Coder ${context.electronPlatformName}/${arch} est absent. Exécutez pnpm run prepare:coder ${arch || ""}.`);
  }
}
