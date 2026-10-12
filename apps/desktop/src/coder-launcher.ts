// Coder démarre son propre processus Electron : ses handlers IPC et modules natifs
// doivent être initialisés par son point d'entrée, avant d'afficher l'éditeur.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { app } from "electron";

export function resolveCoderExecutable(): string | null {
  const relative = process.platform === "win32"
    ? "mAI Coder.exe"
    : process.platform === "darwin"
      ? "mAI Coder.app/Contents/MacOS/mAI Coder"
      : "mai-coder";
  const root = app.isPackaged
    ? path.join(process.resourcesPath, "coder")
    : path.resolve(__dirname, `../build/coder-${process.arch}`);
  const executable = path.join(root, relative);
  return existsSync(executable) ? executable : null;
}

export async function launchCoder(opts?: { workspacePath?: string }): Promise<{ success: boolean; error?: string }> {
  const executable = resolveCoderExecutable();
  if (!executable) {
    return { success: false, error: "Coder est absent du paquet mAI. Installez la dernière application de bureau ou exécutez pnpm run prepare:coder en développement." };
  }
  if (opts?.workspacePath !== undefined && typeof opts.workspacePath !== "string") {
    return { success: false, error: "Le chemin de l’espace de travail est invalide." };
  }
  // Retirer le mode Node hérité, sinon Electron exécuterait son binaire comme Node.
  const env = { ...process.env, MAI_CODER_LOAD_DIST: "1" };
  delete (env as NodeJS.ProcessEnv).ELECTRON_RUN_AS_NODE;
  const args = opts?.workspacePath ? [`--workspace=${opts.workspacePath}`] : [];
  return new Promise((resolve) => {
    try {
      const child = spawn(executable, args, { cwd: path.dirname(executable), detached: true, stdio: "ignore", env, windowsHide: false });
      child.once("error", (error) => resolve({ success: false, error: `Impossible de lancer Coder : ${error.message}` }));
      child.once("spawn", () => {
        child.unref();
        resolve({ success: true });
      });
    } catch (error) {
      resolve({ success: false, error: `Impossible de lancer Coder : ${String(error)}` });
    }
  });
}
