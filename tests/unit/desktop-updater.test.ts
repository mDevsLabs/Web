import { describe, expect, it, vi } from "vitest";
import { selectAssetForCurrentPlatform } from "../../apps/desktop/src/updater";

describe("updater bureau", () => {
  const assets = [
    { name: "latest.yml", browser_download_url: "https://example.com/latest.yml", size: 100 },
    { name: "mAI-win-x64-0.9.1.exe", browser_download_url: "https://example.com/mAI-win-x64-0.9.1.exe", size: 125000000 },
    { name: "mAI-Coder-0.9.1-x64.exe", browser_download_url: "https://example.com/mAI-Coder-0.9.1-x64.exe", size: 120000000 },
    { name: "mAI-0.9.1.dmg", browser_download_url: "https://example.com/mAI-0.9.1.dmg", size: 110000000 },
    { name: "mAI-0.9.1-arm64.dmg", browser_download_url: "https://example.com/mAI-0.9.1-arm64.dmg", size: 110000000 },
    { name: "mAI-0.9.1.AppImage", browser_download_url: "https://example.com/mAI-0.9.1.AppImage", size: 115000000 },
    { name: "mai-desktop_0.9.1_amd64.deb", browser_download_url: "https://example.com/mai-desktop_0.9.1_amd64.deb", size: 90000000 },
  ];

  it("sélectionne l'installateur Windows sans confondre avec Coder", () => {
    vi.stubGlobal("process", { ...process, platform: "win32", arch: "x64" });
    const match = selectAssetForCurrentPlatform(assets);
    expect(match?.name).toBe("mAI-win-x64-0.9.1.exe");
    vi.unstubAllGlobals();
  });

  it("sélectionne l'asset macOS arm64 approprié", () => {
    vi.stubGlobal("process", { ...process, platform: "darwin", arch: "arm64" });
    const match = selectAssetForCurrentPlatform(assets);
    expect(match?.name).toBe("mAI-0.9.1-arm64.dmg");
    vi.unstubAllGlobals();
  });

  it("sélectionne l'asset macOS x64 sans arm64", () => {
    vi.stubGlobal("process", { ...process, platform: "darwin", arch: "x64" });
    const match = selectAssetForCurrentPlatform(assets);
    expect(match?.name).toBe("mAI-0.9.1.dmg");
    vi.unstubAllGlobals();
  });

  it("sélectionne AppImage en priorité sous Linux", () => {
    vi.stubGlobal("process", { ...process, platform: "linux", arch: "x64" });
    const match = selectAssetForCurrentPlatform(assets);
    expect(match?.name).toBe("mAI-0.9.1.AppImage");
    vi.unstubAllGlobals();
  });
});
