import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Migre l'ancien dossier `.async` vers `.mai` si nécessaire.
 * - Si `.mai` n'existe pas et `.async` existe, renomme `.async` -> `.mai`
 * - Si les deux existent, conserve `.mai` (ne supprime pas `.async` pour éviter perte, mais priorise `.mai`)
 * Retourne le chemin du dossier `.mai` (peut ne pas exister si aucun des deux n'existe).
 */
export function migrateWorkspaceAsyncToMai(
  workspaceRoot: string | null | undefined
): string | null {
  if (!workspaceRoot) return null;
  try {
    const asyncDir = path.join(workspaceRoot, ".async");
    const maiDir = path.join(workspaceRoot, ".mai");
    const hasAsync =
      fs.existsSync(asyncDir) && fs.statSync(asyncDir).isDirectory();
    const hasMai = fs.existsSync(maiDir) && fs.statSync(maiDir).isDirectory();
    if (hasAsync && !hasMai) {
      try {
        fs.renameSync(asyncDir, maiDir);
        console.log(`[migrateMai] Renamed ${asyncDir} -> ${maiDir}`);
      } catch (e) {
        // Fallback: copy
        try {
          fs.cpSync(asyncDir, maiDir, { recursive: true });
          console.log(`[migrateMai] Copied ${asyncDir} -> ${maiDir}`);
        } catch (e2) {
          console.warn(
            `[migrateMai] Failed to migrate ${asyncDir}: ${(e2 as Error)?.message ?? e2}`
          );
        }
      }
    }
    return maiDir;
  } catch {
    return null;
  }
}

export function ensureMaiMigratedForPath(
  filePath: string | null | undefined
): void {
  if (!filePath) return;
  try {
    // filePath peut être un workspace root ou un chemin de fichier
    // On tente de trouver le workspace root en remontant jusqu'à trouver .async ou .mai
    // Simplifié: si c'est un dossier, on tente migration
    const stat = fs.statSync(filePath);
    const dir = stat.isDirectory() ? filePath : path.dirname(filePath);
    migrateWorkspaceAsyncToMai(dir);
    // Also try parent (workspace root may be one level up for files like .mai/memory)
    const parent = path.dirname(dir);
    if (parent && parent !== dir) {
      // Only if parent contains .async
      const asyncInParent = path.join(parent, ".async");
      if (fs.existsSync(asyncInParent)) {
        migrateWorkspaceAsyncToMai(parent);
      }
    }
  } catch {
    /* ignore */
  }
}
