import type { BrowserFingerprintSpoofSettings } from "./browserFingerprintNormalize.js";

type RuntimePlatform = "darwin" | "linux" | "win32";

function runtimePlatform(): RuntimePlatform {
  if (typeof process !== "undefined" && typeof process.platform === "string") {
    if (process.platform === "darwin") {
      return "darwin";
    }
    if (process.platform === "linux") {
      return "linux";
    }
    return "win32";
  }
  if (typeof navigator !== "undefined") {
    const uaPlatform =
      (navigator as Navigator & { userAgentData?: { platform?: string } })
        .userAgentData?.platform ??
      navigator.platform ??
      navigator.userAgent;
    if (/mac/i.test(uaPlatform)) {
      return "darwin";
    }
    if (/linux/i.test(uaPlatform)) {
      return "linux";
    }
  }
  return "win32";
}

function runtimeChromeVersion(): string {
  if (typeof process !== "undefined" && process.versions?.chrome) {
    return process.versions.chrome;
  }
  if (typeof navigator !== "undefined") {
    const match = navigator.userAgent.match(/Chrome\/([\d.]+)/i);
    if (match?.[1]) {
      return match[1];
    }
  }
  return "120.0.0.0";
}

/** 与 Electron 捆绑 Chromium 版本一致的 Chrome 风格 UA（不含 Electron 字样）。 */
export function buildChromeLikeUserAgent(
  chromeVersion = runtimeChromeVersion()
): string {
  const platform = runtimePlatform();
  if (platform === "darwin") {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
  }
  if (platform === "linux") {
    return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
  }
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}

/** 内置浏览器默认指纹：与当前 OS 自洽，默认隐藏 webdriver，不阻断 WebRTC。 */
export function getDefaultBrowserFingerprintForPlatform(): BrowserFingerprintSpoofSettings {
  const platform = runtimePlatform();
  if (platform === "darwin") {
    return {
      availHeightOffset: 25,
      colorDepth: 30,
      deviceMemory: 16,
      devicePixelRatio: 2,
      hardwareConcurrency: 10,
      languages: "zh-CN, zh, en",
      maskWebdriver: true,
      platform: "MacIntel",
      screenHeight: 900,
      screenWidth: 1440,
    };
  }
  if (platform === "linux") {
    return {
      availHeightOffset: 40,
      colorDepth: 24,
      deviceMemory: 8,
      devicePixelRatio: 1,
      hardwareConcurrency: 8,
      languages: "zh-CN, zh, en",
      maskWebdriver: true,
      platform: "Linux x86_64",
      screenHeight: 1080,
      screenWidth: 1920,
    };
  }
  return {
    availHeightOffset: 40,
    colorDepth: 24,
    deviceMemory: 8,
    devicePixelRatio: 1,
    hardwareConcurrency: 8,
    languages: "zh-CN, zh, en",
    maskWebdriver: true,
    platform: "Win32",
    screenHeight: 1080,
    screenWidth: 1920,
  };
}
