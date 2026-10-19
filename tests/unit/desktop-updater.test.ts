import { describe, expect, it, vi } from "vitest";
import { selectAssetForCurrentPlatform } from "../../apps/desktop/src/updater";

const asset = (name: string, size: number) => ({
  browser_download_url: `https://example.com/${name}`,
  name,
  size,
});

const assets = [
  asset("latest.yml", 100),
  asset("mAI-win-x64-0.9.1.exe", 125_000_000),
  asset("mAI-0.9.1-win-x64-portable.exe", 125_000_000),
  asset("mAI-Coder-0.9.1-x64.exe", 120_000_000),
  asset("mAI-0.9.1.dmg", 110_000_000),
  asset("mAI-0.9.1-arm64.dmg", 110_000_000),
  asset("mAI-0.9.1.AppImage", 115_000_000),
  asset("mai-desktop_0.9.1_amd64.deb", 90_000_000),
];

function selectFor(platform: string, arch: string) {
  vi.stubGlobal("process", { ...process, arch, platform });
  try {
    return selectAssetForCurrentPlatform(assets);
  } finally {
    vi.unstubAllGlobals();
  }
}

describe("updater bureau", () => {
  it("sélectionne l'installateur Windows sans confondre avec Coder", () => {
    expect(selectFor("win32", "x64")?.name).toBe("mAI-win-x64-0.9.1.exe");
  });

  it("ignore le paquet portable Windows", () => {
    vi.stubGlobal("process", { ...process, arch: "x64", platform: "win32" });
    const name = selectAssetForCurrentPlatform([
      asset("mAI-0.9.1-win-x64-portable.exe", 125_000_000),
    ])?.name;
    vi.unstubAllGlobals();
    expect(name).toBeUndefined();
  });

  it("préfère l'installateur nommé setup", () => {
    vi.stubGlobal("process", { ...process, arch: "x64", platform: "win32" });
    const name = selectAssetForCurrentPlatform([
      asset("mAI-win-x64-0.9.1.exe", 125_000_000),
      asset("mAI-0.9.2-win-x64-setup.exe", 126_000_000),
    ])?.name;
    vi.unstubAllGlobals();
    expect(name).toBe("mAI-0.9.2-win-x64-setup.exe");
  });

  it("sélectionne l'asset macOS arm64 approprié", () => {
    expect(selectFor("darwin", "arm64")?.name).toBe("mAI-0.9.1-arm64.dmg");
  });

  it("sélectionne l'asset macOS x64 sans arm64", () => {
    expect(selectFor("darwin", "x64")?.name).toBe("mAI-0.9.1.dmg");
  });

  it("sélectionne AppImage en priorité sous Linux", () => {
    expect(selectFor("linux", "x64")?.name).toBe("mAI-0.9.1.AppImage");
  });
});
