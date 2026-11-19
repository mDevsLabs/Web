// Issue #13 — la comparaison de versions doit être semver, pas une simple
// différence de chaîne. Aucun téléchargement ici : uniquement le choix de la
// release.
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  compareVersions,
  type GithubRelease,
  parseReleaseTag,
  parseVersionString,
  type ReleaseAsset,
  resolveRequestedChannel,
  selectUpdateCandidate,
} from "../../apps/desktop/src/updater";

const asset = (name: string, size = 100): ReleaseAsset => ({
  browser_download_url: `https://github.com/mDevsLabs/Web/releases/download/tag/${name}`,
  name,
  size,
});

const release = (
  tag: string,
  assets: ReleaseAsset[],
  prerelease = false
): GithubRelease => ({
  assets,
  body: "",
  name: tag,
  prerelease,
  published_at: "2026-01-01",
  tag_name: tag,
});

const WIN_ASSET = asset("mAI-0.9.3-win-x64-setup.exe");

function selectOn(
  releases: GithubRelease[],
  currentVersion: string,
  channel: "stable" | "beta" | "pr" = "stable"
) {
  vi.stubGlobal("process", { ...process, arch: "x64", platform: "win32" });
  try {
    return selectUpdateCandidate(releases, { channel, currentVersion });
  } finally {
    vi.unstubAllGlobals();
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parsing des tags publiés (contrat release-version.mjs)", () => {
  it("analyse stable, beta et pr avec leur compteur de build", () => {
    expect(parseReleaseTag("stable.0.9.3")).toEqual({
      channel: "stable",
      version: { build: null, major: 0, minor: 9, patch: 3 },
    });
    expect(parseReleaseTag("beta.0.9.3-2")).toEqual({
      channel: "beta",
      version: { build: 2, major: 0, minor: 9, patch: 3 },
    });
    expect(parseReleaseTag("pr.0.9.3-20")).toEqual({
      channel: "pr",
      version: { build: 20, major: 0, minor: 9, patch: 3 },
    });
  });

  it("traite un tag ancien sans préfixe comme stable et refuse l'inconnu", () => {
    expect(parseReleaseTag("v0.9.1")?.channel).toBe("stable");
    expect(parseReleaseTag("0.9.1")).not.toBeNull();
    expect(parseReleaseTag("n'importe-quoi")).toBeNull();
    expect(parseReleaseTag("")).toBeNull();
  });

  it("analyse les numéros de version nus de l'installation", () => {
    expect(parseVersionString("0.9.3")).toEqual({
      build: null,
      major: 0,
      minor: 9,
      patch: 3,
    });
    expect(parseVersionString("0.9.3-2")?.build).toBe(2);
    expect(parseVersionString("version-invalide")).toBeNull();
  });
});

describe("comparaison semver", () => {
  const v = (raw: string) => {
    const parsed = parseVersionString(raw);
    if (!parsed) throw new Error(`Version illisible : ${raw}`);
    return parsed;
  };

  it("ordonne par numéro de base puis par compteur de build", () => {
    expect(compareVersions(v("0.9.4"), v("0.9.3"))).toBeGreaterThan(0);
    expect(compareVersions(v("0.9.2"), v("0.9.3"))).toBeLessThan(0);
    expect(compareVersions(v("0.9.3-3"), v("0.9.3-2"))).toBeGreaterThan(0);
    expect(compareVersions(v("0.9.3"), v("0.9.3"))).toBe(0);
  });

  it("une release finale est plus récente que tout build du même numéro", () => {
    expect(compareVersions(v("0.9.3"), v("0.9.3-2"))).toBeGreaterThan(0);
    expect(compareVersions(v("0.9.3-2"), v("0.9.3"))).toBeLessThan(0);
  });
});

describe("canal demandé", () => {
  it("filtre par canal : la bêta voit aussi les stables, pas l'inverse", () => {
    expect(resolveRequestedChannel("beta", "0.9.3")).toBe("beta");
    expect(resolveRequestedChannel("stable", "0.9.3")).toBe("stable");
    expect(resolveRequestedChannel(undefined, "0.9.3")).toBe("stable");
    expect(resolveRequestedChannel(undefined, "0.9.3-beta")).toBe("beta");
  });
});

describe("sélection de la mise à jour (issue #13)", () => {
  it("stable.0.9.3 n'est pas une mise à jour pour 0.9.3", () => {
    const selection = selectOn([release("stable.0.9.3", [WIN_ASSET])], "0.9.3");
    expect(selection.hasUpdate).toBe(false);
  });

  it("stable.0.9.2 n'est jamais proposé à 0.9.3 (pas de downgrade)", () => {
    const selection = selectOn([release("stable.0.9.2", [WIN_ASSET])], "0.9.3");
    expect(selection.hasUpdate).toBe(false);
    expect(selection.asset?.name).toBe(WIN_ASSET.name);
  });

  it("une version plus récente du bon canal est proposée", () => {
    const selection = selectOn(
      [
        release("stable.0.9.2", [WIN_ASSET]),
        release("stable.0.9.4", [asset("mAI-0.9.4-win-x64-setup.exe")]),
      ],
      "0.9.3"
    );
    expect(selection.hasUpdate).toBe(true);
    expect(selection.release?.tag_name).toBe("stable.0.9.4");
    expect(selection.asset?.name).toBe("mAI-0.9.4-win-x64-setup.exe");
  });

  it("une préversion n'est jamais proposée à une installation stable", () => {
    const selection = selectOn(
      [release("beta.0.9.4-1", [asset("mAI-0.9.4-win-x64-setup.exe")], true)],
      "0.9.3",
      "stable"
    );
    expect(selection.hasUpdate).toBe(false);
    expect(selection.sawEligible).toBe(false);
  });

  it("une installation bêta voit les releases bêta ET stables plus récentes", () => {
    const betaSeule = selectOn(
      [release("beta.0.9.4-1", [asset("mAI-0.9.4-win-x64-setup.exe")], true)],
      "0.9.3",
      "beta"
    );
    expect(betaSeule.hasUpdate).toBe(true);
    expect(betaSeule.release?.tag_name).toBe("beta.0.9.4-1");

    const stablePlusRecente = selectOn(
      [
        release("beta.0.9.4-1", [asset("mAI-0.9.4-win-x64-setup.exe")], true),
        release("stable.0.9.4", [asset("mAI-0.9.4-win-x64-setup.exe")]),
      ],
      "0.9.3",
      "beta"
    );
    expect(stablePlusRecente.hasUpdate).toBe(true);
    // Même numéro de base : la release finale prime sur le build bêta.
    expect(stablePlusRecente.release?.tag_name).toBe("stable.0.9.4");
  });

  it("le même numéro de base n'est jamais une mise à jour", () => {
    const memeNumero = selectOn(
      [release("beta.0.9.3-2", [WIN_ASSET], true)],
      "0.9.3",
      "beta"
    );
    expect(memeNumero.hasUpdate).toBe(false);
  });

  it("un build bêta plus récent l'est pour une installation déjà suffixée", () => {
    const selection = selectOn(
      [release("beta.0.9.3-3", [WIN_ASSET], true)],
      "0.9.3-2",
      "beta"
    );
    expect(selection.hasUpdate).toBe(true);
    expect(selection.release?.tag_name).toBe("beta.0.9.3-3");
  });

  it("une release sans asset pour la plateforme est ignorée", () => {
    const selection = selectOn(
      [
        release("stable.0.9.9", [asset("latest.yml"), asset("mAI-0.9.9.dmg")]),
        release("stable.0.9.4", [WIN_ASSET]),
      ],
      "0.9.3"
    );
    expect(selection.release?.tag_name).toBe("stable.0.9.4");
  });

  it("sans aucune release compatible, aucune mise à jour n'est proposée", () => {
    const selection = selectOn(
      [release("stable.0.9.9", [asset("latest.yml")])],
      "0.9.3"
    );
    expect(selection.hasUpdate).toBe(false);
    expect(selection.sawEligible).toBe(false);
  });
});
