import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const DIR = "mai";
const LEGACY = "void-shell";
const LEGACY_ASYNC = "async";
let cachedMaiDataDir = "";
// alias pour compatibilité ancienne variable
let cachedAsyncDataDir: string = "" as unknown as string;
void cachedAsyncDataDir;

/** 应用数据目录；若仅有旧版 void-shell 或 async 目录则一次性复制到 mai，避免丢设置与线程。 */
export function resolveMaiDataDir(userData: string): string {
  const dir = path.join(userData, DIR);
  const legacy = path.join(userData, LEGACY);
  const legacyAsync = path.join(userData, LEGACY_ASYNC);
  if (!fs.existsSync(dir) && fs.existsSync(legacy)) {
    try {
      fs.cpSync(legacy, dir, { recursive: true });
    } catch {
      /* 复制失败时仍使用新目录 */
    }
  }
  if (!fs.existsSync(dir) && fs.existsSync(legacyAsync)) {
    try {
      fs.cpSync(legacyAsync, dir, { recursive: true });
    } catch {
      /* 复制失败时仍使用新目录 */
    }
  }
  fs.mkdirSync(dir, { recursive: true });
  cachedMaiDataDir = dir;
  cachedAsyncDataDir = dir;
  return dir;
}

export function getCachedMaiDataDir(): string {
  if (cachedMaiDataDir) {
    return cachedMaiDataDir;
  }
  // Fallback homedir uniquement si resolveMaiDataDir n'a jamais été appelé
  // (tests). En prod, resolve est toujours appelé avant tout store.
  // Log un avertissement pour détecter les doubles dirs (sessionDb vs settings).
  console.warn(
    "[dataDir] getCachedMaiDataDir avant resolveMaiDataDir — fallback homedir (risque double dir)."
  );
  const fallback = path.join(os.homedir(), `.${DIR}`);
  const fallbackLegacy = path.join(os.homedir(), `.${LEGACY_ASYNC}`);
  if (!fs.existsSync(fallback) && fs.existsSync(fallbackLegacy)) {
    try {
      fs.cpSync(fallbackLegacy, fallback, { recursive: true });
    } catch {
      /* ignore */
    }
  }
  fs.mkdirSync(fallback, { recursive: true });
  cachedMaiDataDir = fallback;
  cachedAsyncDataDir = fallback;
  return cachedMaiDataDir;
}

// Alias rétro-compatibilité (ancien nom Async)
export const resolveAsyncDataDir = resolveMaiDataDir;
export const getCachedAsyncDataDir = getCachedMaiDataDir;
