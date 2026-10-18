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
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

const GITHUB_RELEASES_API = "https://api.github.com/repos/mDevsLabs/Web/releases";

export function selectAssetForCurrentPlatform(assets: ReleaseAsset[]): ReleaseAsset | null {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === "win32") {
    // Windows : installateur .exe (ex: mAI-win-x64-0.9.1.exe ou mAI.Setup.0.9.1.exe)
    const winExe = assets.filter(
      (a) =>
        a.name.endsWith(".exe") &&
        !a.name.toLowerCase().includes("coder") &&
        !a.name.toLowerCase().includes("debug")
    );
    // Priorité à un asset explicitement nommé avec mAI-win ou Setup
    const preferred =
      winExe.find((a) => a.name.toLowerCase().includes("win") || a.name.toLowerCase().includes("setup")) ||
      winExe[0];
    return preferred ?? null;
  }

  if (platform === "darwin") {
    // macOS : .dmg (ou .zip)
    const dmgs = assets.filter(
      (a) => a.name.endsWith(".dmg") && !a.name.toLowerCase().includes("coder")
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
      (a) => a.name.endsWith(".zip") && a.name.toLowerCase().includes("mac") && !a.name.toLowerCase().includes("coder")
    );
    return zips[0] ?? null;
  }

  if (platform === "linux") {
    // Linux : AppImage en priorité, sinon deb ou rpm
    const appImages = assets.filter(
      (a) => a.name.endsWith(".AppImage") && !a.name.toLowerCase().includes("coder")
    );
    if (appImages.length > 0) return appImages[0];

    const debs = assets.filter(
      (a) => a.name.endsWith(".deb") && !a.name.toLowerCase().includes("coder")
    );
    if (debs.length > 0) return debs[0];

    const rpms = assets.filter(
      (a) => a.name.endsWith(".rpm") && !a.name.toLowerCase().includes("coder")
    );
    return rpms[0] ?? null;
  }

  return null;
}

function cleanVersionString(v: string): string {
  return v.replace(/^[vV]/, "").trim();
}

export async function checkForUpdates(includePreReleases = true): Promise<UpdateCheckResult> {
  const currentVersion = app.getVersion();

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

    // Filtrer par canal si demandé
    const eligibleReleases = includePreReleases
      ? releases
      : releases.filter((r) => !r.prerelease);

    if (eligibleReleases.length === 0) {
      return {
        hasUpdate: false,
        currentVersion,
        error: "Aucune release stable trouvée.",
      };
    }

    // Sélectionner la release la plus récente ayant des assets pour notre plateforme
    let targetRelease: GithubRelease | null = null;
    let selectedAsset: ReleaseAsset | null = null;

    for (const rel of eligibleReleases) {
      const asset = selectAssetForCurrentPlatform(rel.assets || []);
      if (asset) {
        targetRelease = rel;
        selectedAsset = asset;
        break;
      }
    }

    if (!targetRelease || !selectedAsset) {
      return {
        hasUpdate: false,
        currentVersion,
        error: `Aucun paquet compatible pour votre système (${process.platform}-${process.arch}) n'a été trouvé.`,
      };
    }

    const latestClean = cleanVersionString(targetRelease.tag_name);
    const currentClean = cleanVersionString(currentVersion);

    // Une mise à jour est disponible si le tag est différent de la version installée
    const hasUpdate = latestClean !== currentClean;

    return {
      hasUpdate,
      currentVersion,
      latestVersion: targetRelease.tag_name,
      releaseName: targetRelease.name || targetRelease.tag_name,
      releaseNotes: targetRelease.body || "",
      publishedAt: targetRelease.published_at,
      downloadUrl: selectedAsset.browser_download_url,
      fileName: selectedAsset.name,
      fileSize: selectedAsset.size,
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
  downloadUrl: string,
  fileName: string,
  onProgress: (percent: number, received: number, total: number) => void
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const downloadsDir = app.getPath("downloads");
    const targetPath = path.join(downloadsDir, fileName);

    const response = await fetch(downloadUrl, {
      headers: { "User-Agent": "mAI-Desktop" },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Échec du téléchargement (${response.status} ${response.statusText})`,
      };
    }

    const contentLength = Number(response.headers.get("content-length")) || 0;
    const body = response.body;

    if (!body) {
      return { success: false, error: "Flux de données vide lors du téléchargement." };
    }

    const fileStream = fs.createWriteStream(targetPath);
    let received = 0;

    const reader = body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        received += value.length;
        fileStream.write(Buffer.from(value));
        const percent = contentLength > 0 ? Math.min(100, Math.round((received / contentLength) * 100)) : 0;
        onProgress(percent, received, contentLength);
      }
    }

    await new Promise<void>((resolve, reject) => {
      fileStream.end(() => resolve());
      fileStream.on("error", reject);
    });

    // Rendre exécutable sur Linux
    if (process.platform === "linux") {
      try {
        fs.chmodSync(targetPath, 0o755);
      } catch {}
    }

    // Lancement automatique de l'installateur
    void shell.openPath(targetPath);

    return { success: true, filePath: targetPath };
  } catch (err) {
    return { success: false, error: `Erreur pendant le téléchargement : ${String(err)}` };
  }
}
