// Coder démarre son propre processus Electron : ses handlers IPC et modules natifs
// doivent être initialisés par son point d'entrée, avant d'afficher l'éditeur.
//
// Version : mAI Desktop n'exécute que le Coder embarqué dans son paquet. Le
// marqueur `coder-version.json`, écrit par `prepare-coder.mjs`, permet de
// refuser un payload périmé au lieu d'ouvrir une version différente de celle
// livrée avec mAI.
//
// JWT : le cookie de session est httpOnly, seul le Main peut le lire. Le jeton
// est transmis à Coder par l'environnement (premier lancement) et par un
// fichier de handoff éphémère référencé dans argv (pour qu'une seconde
// instance puisse le remettre à l'instance déjà ouverte).
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  existsSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { app } from "electron";

export interface EmbeddedCoderVersion {
  builtAt?: string;
  version: string;
}

function resolveCoderRoot(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, "coder")
    : path.resolve(__dirname, `../build/coder-${process.arch}`);
}

function resolveCoderRelativeExecutable(): string {
  return process.platform === "win32"
    ? "mAI Coder.exe"
    : process.platform === "darwin"
      ? "mAI Coder.app/Contents/MacOS/mAI Coder"
      : "mai-coder";
}

export function readEmbeddedCoderVersion(): EmbeddedCoderVersion | null {
  try {
    const marker = path.join(
      resolveCoderRoot(),
      "coder-version.json"
    );
    if (!existsSync(marker)) {
      return null;
    }
    const parsed = JSON.parse(readFileSync(marker, "utf8")) as {
      builtAt?: unknown;
      version?: unknown;
    };
    const version =
      typeof parsed.version === "string" ? parsed.version.trim() : "";
    if (!version) {
      return null;
    }
    return {
      builtAt: typeof parsed.builtAt === "string" ? parsed.builtAt : undefined,
      version,
    };
  } catch {
    return null;
  }
}

export function resolveCoderExecutable(): string | null {
  const root = resolveCoderRoot();
  const executable = path.join(root, resolveCoderRelativeExecutable());
  if (!existsSync(executable)) {
    return null;
  }
  // Refuser un chemin dont un dossier parent se nomme app.asar (cas de
  // résolution imbriquée qui casse le résolveur ESM de Node).
  const segments = path.resolve(executable).split(path.sep);
  if (segments.slice(0, -1).some((s) => s.toLowerCase() === "app.asar")) {
    return null;
  }
  // En mode packagé, s'assurer que le paquet app.asar interne de Coder existe bien.
  if (app.isPackaged) {
    const internalAsar = process.platform === "darwin"
      ? path.join(root, "mAI Coder.app/Contents/Resources/app.asar")
      : path.join(root, "resources/app.asar");
    if (!existsSync(internalAsar)) {
      return null;
    }
  }
  return executable;
}

// Un marqueur manquant correspond à un ancien paquet : ne pas bloquer, mais un
// marqueur présent qui ne correspond pas à la version de mAI Desktop est un
// paquet incohérent, donc refusé.
export function coderVersionError(): string | null {
  const embedded = readEmbeddedCoderVersion();
  if (!embedded) {
    return null;
  }
  if (embedded.version !== app.getVersion()) {
    return `La version embarquée de Coder (${embedded.version}) ne correspond pas à mAI Desktop (${app.getVersion()}). Réinstallez mAI Desktop pour obtenir le Coder livré avec cette version.`;
  }
  return null;
}

function isValidSessionToken(value: string): boolean {
  return value.split(".").length === 3 && value.length <= 8192;
}

function writeSessionHandoff(token: string): string | null {
  try {
    const file = path.join(
      app.getPath("temp"),
      `mai-coder-session-${randomUUID()}.token`
    );
    writeFileSync(file, token, { encoding: "utf8", mode: 0o600 });
    return file;
  } catch {
    return null;
  }
}

function scheduleHandoffCleanup(file: string): void {
  const timer = setTimeout(() => {
    try {
      unlinkSync(file);
    } catch {
      /* déjà lu ou supprimé */
    }
  }, 120_000);
  timer.unref?.();
}

export async function launchCoder(opts?: {
  workspacePath?: string;
  /** Jeton de session mAI transmis par le Main, jamais exposé au renderer. */
  sessionToken?: string;
}): Promise<{ success: boolean; error?: string }> {
  const executable = resolveCoderExecutable();
  if (!executable) {
    return { success: false, error: "Coder est absent du paquet mAI. Installez la dernière application de bureau ou exécutez pnpm run prepare:coder en développement." };
  }
  const versionError = coderVersionError();
  if (versionError) {
    return { success: false, error: versionError };
  }
  if (opts?.workspacePath !== undefined && typeof opts.workspacePath !== "string") {
    return { success: false, error: "Le chemin de l’espace de travail est invalide." };
  }
  // Retirer le mode Node hérité, sinon Electron exécuterait son binaire comme Node.
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    // Coder doit rester la version livrée : il ne se met pas à jour tout seul
    // depuis GitHub quand il est embarqué dans mAI Desktop.
    MAI_CODER_EMBEDDED: "1",
    MAI_CODER_LOAD_DIST: "1",
  };
  delete (env as NodeJS.ProcessEnv).ELECTRON_RUN_AS_NODE;
  delete (env as NodeJS.ProcessEnv).NODE_OPTIONS;
  // Aligner Coder sur le backend utilisé par mAI Desktop quand il est fourni.
  const apiBase =
    process.env.MAI_API_BASE?.trim() ||
    process.env.MAI_API_URL?.trim() ||
    "https://mai.val.run";
  env.MAI_API_BASE = apiBase.replace(/\/+$/, "");
  const embeddedVersion = readEmbeddedCoderVersion();
  if (embeddedVersion) {
    env.MAI_CODER_EMBEDDED_VERSION = embeddedVersion.version;
  } else {
    delete (env as NodeJS.ProcessEnv).MAI_CODER_EMBEDDED_VERSION;
  }
  const token = opts?.sessionToken?.trim();
  if (token && isValidSessionToken(token)) {
    env.MAI_SESSION_TOKEN = token;
  } else {
    delete (env as NodeJS.ProcessEnv).MAI_SESSION_TOKEN;
  }
  // Utiliser le home de l'utilisateur comme cwd plutôt que le dossier du payload,
  // pour éviter que Node/Electron résolve les modules ou exports dans le paquet Coder.
  const cwd = app.getPath("home");
  const args: string[] = [];
  if (opts?.workspacePath) {
    args.push(`--workspace=${opts.workspacePath}`);
  }
  const handoffFile =
    token && isValidSessionToken(token) ? writeSessionHandoff(token) : null;
  if (handoffFile) {
    args.push(`--mai-session-token-file=${handoffFile}`);
    scheduleHandoffCleanup(handoffFile);
  }
  return new Promise((resolve) => {
    try {
      const child = spawn(executable, args, { cwd, detached: true, stdio: "ignore", env, windowsHide: false });
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
