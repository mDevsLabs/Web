// Vérification de mise à jour et téléchargement d'installeurs.
//
// DEUX CONTRATS, DEUX ISSUES
//
// - Issue #13 : les tags publiés suivent `scripts/release-version.mjs`
//   (`stable.x.y.z`, `beta.x.y.z-n`, `pr.x.y.z-n`). Une simple différence de
//   chaîne n'est PAS une mise à jour : le canal demandé est filtré, la
//   meilleure release compatible est choisie explicitement (tri semver
//   décroissant), et un téléchargement n'est proposé que si la candidate est
//   strictement plus récente que la version installée — jamais un downgrade,
//   jamais le même numéro sous un autre préfixe.
//
// - Issue #28 : l'installeur n'est ouvert qu'après contrôle. Le Main choisit
//   lui-même l'asset ; le renderer ne transmet qu'un identifiant opaque.
//   L'URL doit être HTTPS et allowlistée, le nom de fichier un basename
//   strict, et la taille comme le SHA-256 doivent correspondre au manifeste
//   `installer-manifest.json` publié avec la release. Sans manifeste
//   exploitable, rien n'est proposé ni ouvert (fail closed).
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { app, shell } from "electron";

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface GithubRelease {
  tag_name: string;
  name: string;
  body: string;
  prerelease: boolean;
  published_at: string;
  assets: ReleaseAsset[];
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseName?: string;
  releaseNotes?: string;
  publishedAt?: string;
  fileName?: string;
  fileSize?: number;
  /** Identifiant opaque du téléchargement, jamais l'URL (issue #28). */
  updateId?: string;
  error?: string;
}

const GITHUB_RELEASES_API = "https://api.github.com/repos/mDevsLabs/Web/releases";

// ─────────────────────────────────────────────────────────────────────────────
// Parsing et comparaison de versions (issue #13)
// ─────────────────────────────────────────────────────────────────────────────

export type ReleaseChannel = "stable" | "beta" | "pr";

export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  /** Compteur de build du canal (`beta.x.y.z-N`), absent pour une release finale. */
  build: number | null;
}

export interface ParsedTag {
  channel: ReleaseChannel;
  version: ParsedVersion;
}

const TAG_RE = /^(stable|beta|pr)\.(\d+)\.(\d+)\.(\d+)(?:-(\d+))?$/;
const VERSION_RE = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

/** Analyse un numéro de version nu (`0.9.3`, `v0.9.3`, `0.9.3-2`). */
export function parseVersionString(raw: string): ParsedVersion | null {
  const match = VERSION_RE.exec(String(raw ?? "").trim());
  if (!match) return null;
  const suffix = match[4];
  return {
    build: suffix && /^\d+$/.test(suffix) ? Number(suffix) : null,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

/**
 * Analyse un tag de release (`stable.x.y.z`, `beta.x.y.z-n`, `pr.x.y.z-n`).
 *
 * Un tag ancien sans préfixe de canal est traité comme stable : les releases
 * historiques du dépôt n'en portaient pas.
 */
export function parseReleaseTag(raw: string): ParsedTag | null {
  const tag = String(raw ?? "").trim();
  const match = TAG_RE.exec(tag);
  if (match) {
    const channel = match[1];
    if (channel !== "stable" && channel !== "beta" && channel !== "pr") {
      return null;
    }
    return {
      channel,
      version: {
        build: match[5] ? Number(match[5]) : null,
        major: Number(match[2]),
        minor: Number(match[3]),
        patch: Number(match[4]),
      },
    };
  }
  const version = parseVersionString(tag);
  return version ? { channel: "stable", version } : null;
}

/**
 * Comparaison semver stricte.
 *
 * Même numéro de base : une release finale (sans suffixe) est plus récente
 * que n'importe quel build `x.y.z-n` de ce numéro, et deux builds se
 * comparent par leur compteur. Un candidat à numéro de base égal n'est donc
 * jamais « plus récent » qu'une installation finale du même numéro : le même
 * numéro sous un autre préfixe n'est pas une mise à jour.
 */
export function compareVersions(a: ParsedVersion, b: ParsedVersion): number {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  if (a.build === null && b.build === null) return 0;
  if (a.build === null) return 1;
  if (b.build === null) return -1;
  if (a.build === b.build) return 0;
  return a.build < b.build ? -1 : 1;
}

/**
 * Canaux éligibles pour un canal demandé : son canal, puis les canaux plus
 * stables. Une installation bêta voit donc aussi les releases stables plus
 * récentes ; une installation stable ne voit jamais une préversion.
 */
export function eligibleChannels(channel: ReleaseChannel): ReleaseChannel[] {
  if (channel === "pr") return ["pr", "beta", "stable"];
  if (channel === "beta") return ["beta", "stable"];
  return ["stable"];
}

/** Canal demandé par l'installation (env `MAI_DESKTOP_CHANNEL`, puis heuristique de version). */
export function resolveRequestedChannel(
  env: string | undefined,
  version: string
): ReleaseChannel {
  const channel = (env ?? "").toLowerCase().trim();
  if (channel === "pr") return "pr";
  if (channel === "beta") return "beta";
  if (channel === "stable") return "stable";
  const lower = version.toLowerCase();
  if (lower.includes("pr")) return "pr";
  if (lower.includes("beta")) return "beta";
  return "stable";
}

export function selectAssetForCurrentPlatform(
  assets: ReleaseAsset[]
): ReleaseAsset | null {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === "win32") {
    // Windows : uniquement l'installateur. Un paquet « portable » s'extrait dans
    // %TEMP% à chaque lancement : il ne remplace jamais l'installation et peut
    // démarrer sur une extraction incomplète (modules natifs absents).
    const winExe = assets.filter(
      (a) =>
        a.name.endsWith(".exe") &&
        !a.name.toLowerCase().includes("coder") &&
        !a.name.toLowerCase().includes("debug") &&
        !a.name.toLowerCase().includes("portable") &&
        !a.name.toLowerCase().includes("uninstall")
    );
    // Priorité à l'installateur nommé « setup », puis à l'ancien nom
    // `mAI-win-<arch>-<version>.exe` des releases déjà publiées.
    const preferred =
      winExe.find((a) => a.name.toLowerCase().includes("setup")) ||
      winExe.find((a) => a.name.toLowerCase().includes("win")) ||
      winExe[0];
    return preferred ?? null;
  }

  if (platform === "darwin") {
    // macOS : .dmg (ou .zip)
    const dmgs = assets.filter(
      (a) =>
        a.name.endsWith(".dmg") && !a.name.toLowerCase().includes("coder")
    );
    if (arch === "arm64") {
      const armDmg = dmgs.find((a) => a.name.toLowerCase().includes("arm64"));
      if (armDmg) return armDmg;
    } else {
      const x64Dmg = dmgs.find((a) => !a.name.toLowerCase().includes("arm64"));
      if (x64Dmg) return x64Dmg;
    }
    if (dmgs.length > 0) return dmgs[0];

    const zips = assets.filter(
      (a) =>
        a.name.endsWith(".zip") &&
        a.name.toLowerCase().includes("mac") &&
        !a.name.toLowerCase().includes("coder")
    );
    return zips[0] ?? null;
  }

  if (platform === "linux") {
    // Linux : AppImage en priorité, sinon deb ou rpm
    const appImages = assets.filter(
      (a) =>
        a.name.endsWith(".AppImage") &&
        !a.name.toLowerCase().includes("coder")
    );
    if (appImages.length > 0) return appImages[0];

    const debs = assets.filter(
      (a) =>
        a.name.endsWith(".deb") && !a.name.toLowerCase().includes("coder")
    );
    if (debs.length > 0) return debs[0];

    const rpms = assets.filter(
      (a) =>
        a.name.endsWith(".rpm") && !a.name.toLowerCase().includes("coder")
    );
    return rpms[0] ?? null;
  }

  return null;
}

export interface CandidateSelection {
  /** Meilleur asset compatible de la meilleure release éligible. */
  asset: ReleaseAsset | null;
  /** Vrai si cette release est strictement plus récente que la version installée. */
  hasUpdate: boolean;
  /** Meilleure release éligible, même si elle n'est pas une mise à jour. */
  release: GithubRelease | null;
  /** Au moins une release éligible avec asset compatible a été trouvée. */
  sawEligible: boolean;
}

/**
 * Choix explicite de la mise à jour (issue #13) : canal filtré, meilleure
 * release compatible en premier, et « mise à jour » uniquement si la
 * candidate est strictement plus récente que la version installée.
 */
export function selectUpdateCandidate(
  releases: readonly GithubRelease[],
  options: { channel: ReleaseChannel; currentVersion: string }
): CandidateSelection {
  const current = parseVersionString(options.currentVersion);
  const allowed = eligibleChannels(options.channel);
  let best: {
    asset: ReleaseAsset;
    release: GithubRelease;
    tag: ParsedTag;
  } | null = null;
  let sawEligible = false;

  for (const release of releases) {
    const tag = parseReleaseTag(release.tag_name ?? "");
    if (!tag || !allowed.includes(tag.channel)) continue;
    const asset = selectAssetForCurrentPlatform(release.assets || []);
    if (!asset) continue;
    sawEligible = true;
    if (!best || compareVersions(tag.version, best.tag.version) > 0) {
      best = { asset, release, tag };
    }
  }

  if (!best) {
    return { asset: null, hasUpdate: false, release: null, sawEligible };
  }
  return {
    asset: best.asset,
    hasUpdate: current !== null && compareVersions(best.tag.version, current) > 0,
    release: best.release,
    sawEligible,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Vérification d'intégrité des installeurs (issue #28)
// ─────────────────────────────────────────────────────────────────────────────

/** Nom du manifeste d'intégrité publié avec chaque release. */
export const INSTALLER_MANIFEST_NAME = "installer-manifest.json";

/**
 * Hôtes autorisés pour un téléchargement d'installateur : les releases GitHub
 * et le CDN qui sert leurs assets après redirection. Tout le reste est refusé.
 */
const ALLOWED_INSTALLER_HOSTS = [
  "github.com",
  "objects.githubusercontent.com",
] as const;

export function isAllowedInstallerUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(String(raw ?? ""));
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  return ALLOWED_INSTALLER_HOSTS.some((allowed) => allowed === host);
}

/** Basename strict : pas de séparateur, pas de chemin relatif, pas d'octet nul. */
export function isSafeFileName(name: string): boolean {
  const value = String(name ?? "");
  if (value.length === 0 || value.length > 255) return false;
  if (value.includes("/") || value.includes("\\") || value.includes("\0")) {
    return false;
  }
  if (value === "." || value === "..") return false;
  return value === path.basename(value);
}

export interface InstallerManifestEntry {
  name: string;
  sha256: string;
  size: number;
}

/**
 * Analyse `installer-manifest.json` : `{ "files": [{ name, size, sha256 }] }`.
 * Toute entrée invalide est ignorée : une entrée douteuse ne doit jamais
 * valider un binaire.
 */
export function parseInstallerManifest(
  text: string
): Map<string, InstallerManifestEntry> {
  const entries = new Map<string, InstallerManifestEntry>();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return entries;
  }
  const files =
    parsed && typeof parsed === "object"
      ? (parsed as { files?: unknown }).files
      : undefined;
  if (!Array.isArray(files)) return entries;
  for (const raw of files) {
    if (!raw || typeof raw !== "object") continue;
    const { name, sha256, size } = raw as {
      name?: unknown;
      sha256?: unknown;
      size?: unknown;
    };
    if (typeof name !== "string" || !isSafeFileName(name)) continue;
    if (typeof sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(sha256)) continue;
    if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
      continue;
    }
    entries.set(name, { name, sha256, size });
  }
  return entries;
}

/** Cible de téléchargement vérifiable, fabriquée par le Main seul. */
export interface PendingUpdate {
  fileName: string;
  sha256: string;
  size: number;
  url: string;
}

const pendingUpdates = new Map<string, PendingUpdate>();
let managedInstallerPath: string | null = null;

/**
 * Enregistre la mise à jour à télécharger et renvoie un identifiant opaque :
 * le renderer ne reçoit ni l'URL, ni le hash, et ne peut demander que la
 * cible choisie par le Main.
 */
export function registerPendingUpdate(pending: PendingUpdate): string {
  pendingUpdates.clear();
  const updateId = crypto.randomUUID();
  pendingUpdates.set(updateId, pending);
  return updateId;
}

export function getPendingUpdate(updateId: string): PendingUpdate | null {
  if (typeof updateId !== "string") return null;
  return pendingUpdates.get(updateId) ?? null;
}

/**
 * Vrai si le chemin est bien l'installeur téléchargé et vérifié par le Main :
 * la fenêtre À propos ne peut ouvrir que ce fichier.
 */
export function isManagedInstallerPath(filePath: string): boolean {
  return managedInstallerPath !== null && filePath === managedInstallerPath;
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const currentVersion = app.getVersion();
  const channel = resolveRequestedChannel(
    process.env.MAI_DESKTOP_CHANNEL,
    currentVersion
  );

  try {
    const response = await fetch(GITHUB_RELEASES_API, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "mAI-Desktop",
      },
    });

    if (!response.ok) {
      return {
        hasUpdate: false,
        currentVersion,
        error: `Erreur GitHub API (${response.status} ${response.statusText}).`,
      };
    }

    const releases = (await response.json()) as GithubRelease[];
    if (!Array.isArray(releases) || releases.length === 0) {
      return {
        hasUpdate: false,
        currentVersion,
        error: "Aucune version publiée trouvée sur le dépôt GitHub.",
      };
    }

    const selection = selectUpdateCandidate(releases, {
      channel,
      currentVersion,
    });

    if (!selection.release || !selection.asset) {
      return {
        hasUpdate: false,
        currentVersion,
        error: selection.sawEligible
          ? undefined
          : `Aucun paquet compatible pour votre système (${process.platform}-${process.arch}) n'a été trouvé.`,
      };
    }

    const { asset, release } = selection;

    if (!selection.hasUpdate) {
      // Pas de downgrade, pas du même numéro sous un autre préfixe.
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: release.tag_name,
      };
    }

    // Fail closed : sans manifeste d'intégrité exploitable, aucune mise à jour
    // n'est proposée — un binaire non authentifié n'est jamais ouvert.
    const manifestAsset = (release.assets || []).find(
      (a) => a.name === INSTALLER_MANIFEST_NAME
    );
    if (
      !manifestAsset ||
      !isAllowedInstallerUrl(manifestAsset.browser_download_url)
    ) {
      return {
        hasUpdate: false,
        currentVersion,
        error: "Release non vérifiable : manifeste d'intégrité absent.",
      };
    }

    let manifest: Map<string, InstallerManifestEntry>;
    try {
      const manifestResponse = await fetch(manifestAsset.browser_download_url, {
        headers: { "User-Agent": "mAI-Desktop" },
      });
      if (!manifestResponse.ok) {
        throw new Error(`HTTP ${manifestResponse.status}`);
      }
      manifest = parseInstallerManifest(await manifestResponse.text());
    } catch {
      return {
        hasUpdate: false,
        currentVersion,
        error: "Release non vérifiable : manifeste d'intégrité illisible.",
      };
    }

    const entry = manifest.get(asset.name);
    if (!entry || entry.size !== asset.size) {
      // La taille du manifeste doit concorder avec celle annoncée par l'asset.
      return {
        hasUpdate: false,
        currentVersion,
        error:
          "Release non vérifiable : installeur absent du manifeste d'intégrité.",
      };
    }
    if (!isAllowedInstallerUrl(asset.browser_download_url)) {
      return {
        hasUpdate: false,
        currentVersion,
        error: "URL de téléchargement refusée.",
      };
    }
    if (!isSafeFileName(asset.name)) {
      return {
        hasUpdate: false,
        currentVersion,
        error: "Nom d'installateur refusé.",
      };
    }

    const updateId = registerPendingUpdate({
      fileName: asset.name,
      sha256: entry.sha256,
      size: entry.size,
      url: asset.browser_download_url,
    });

    return {
      currentVersion,
      fileName: asset.name,
      fileSize: entry.size,
      hasUpdate: true,
      latestVersion: release.tag_name,
      publishedAt: release.published_at,
      releaseName: release.name || release.tag_name,
      releaseNotes: release.body || "",
      updateId,
    };
  } catch (err) {
    return {
      hasUpdate: false,
      currentVersion,
      error: `Impossible de contacter GitHub : ${String(err)}`,
    };
  }
}

export async function downloadAndInstallUpdate(
  target: PendingUpdate,
  onProgress: (percent: number, received: number, total: number) => void
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  // Garde-fous d'entrée : la cible vient du Main, mais aucune étape n'est
  // censée pouvoir fabriquer une URL ou un nom de fichier arbitraire.
  if (!isAllowedInstallerUrl(target.url)) {
    return { success: false, error: "URL de téléchargement refusée." };
  }
  if (!isSafeFileName(target.fileName)) {
    return { success: false, error: "Nom de fichier d'installateur refusé." };
  }
  if (
    !/^[a-f0-9]{64}$/i.test(target.sha256) ||
    !Number.isFinite(target.size) ||
    target.size <= 0
  ) {
    return { success: false, error: "Manifeste d'intégrité invalide." };
  }

  try {
    const downloadsDir = app.getPath("downloads");
    const targetPath = path.join(downloadsDir, path.basename(target.fileName));

    const response = await fetch(target.url, {
      headers: { "User-Agent": "mAI-Desktop" },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Échec du téléchargement (${response.status} ${response.statusText})`,
      };
    }

    const contentLength =
      Number(response.headers.get("content-length")) || target.size;
    const body = response.body;

    if (!body) {
      return {
        success: false,
        error: "Flux de données vide lors du téléchargement.",
      };
    }

    const fileStream = fs.createWriteStream(targetPath);
    const hasher = crypto.createHash("sha256");
    let received = 0;

    const reader = body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        const chunk = Buffer.from(value);
        received += chunk.length;
        hasher.update(chunk);
        fileStream.write(chunk);
        const percent =
          contentLength > 0
            ? Math.min(100, Math.round((received / contentLength) * 100))
            : 0;
        onProgress(percent, received, contentLength);
      }
    }

    await new Promise<void>((resolve, reject) => {
      fileStream.end(() => resolve());
      fileStream.on("error", reject);
    });

    // Contrôle d'intégrité AVANT toute ouverture : taille et SHA-256 doivent
    // correspondre au manifeste de la release. Le fichier écarté est supprimé.
    const digest = hasher.digest("hex");
    if (
      received !== target.size ||
      digest.toLowerCase() !== target.sha256.toLowerCase()
    ) {
      fs.rmSync(targetPath, { force: true });
      return {
        success: false,
        error:
          "L'empreinte de l'installateur téléchargé ne correspond pas au manifeste : fichier écarté.",
      };
    }

    // Rendre exécutable sur Linux
    if (process.platform === "linux") {
      try {
        fs.chmodSync(targetPath, 0o755);
      } catch {}
    }

    managedInstallerPath = targetPath;

    // Le retour de shell.openPath n'est JAMAIS ignoré : une erreur d'ouverture
    // est un échec, pas un succès silencieux.
    const openError = await shell.openPath(targetPath);
    if (openError) {
      return {
        success: false,
        error: `Impossible d'ouvrir l'installateur : ${openError}`,
      };
    }

    return { success: true, filePath: targetPath };
  } catch (err) {
    return {
      success: false,
      error: `Erreur pendant le téléchargement : ${String(err)}`,
    };
  }
}
