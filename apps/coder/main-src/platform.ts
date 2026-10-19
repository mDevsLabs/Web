/**
 * 统一的平台检测模块
 *
 * 平台检测与归一化能力，提供：
 * - 平台类型统一枚举
 * - 使用 memoize 缓存检测结果
 * - WSL 环境精确识别
 * - Linux 发行版信息获取
 */

import { readFileSync } from "node:fs";

export type PlatformType = "windows" | "macos" | "linux" | "wsl" | "unknown";

/**
 * 获取当前运行平台类型（带缓存）
 *
 * 检测逻辑：
 * 1. process.platform === 'win32' → windows
 * 2. process.platform === 'darwin' → macos
 * 3. process.platform === 'linux' + /proc/version 包含 microsoft/wsl → wsl
 * 4. process.platform === 'linux' → linux
 * 5. 其他 → unknown
 */
let cachedPlatform: PlatformType | null = null;

export function getPlatform(): PlatformType {
  if (cachedPlatform !== null) {
    return cachedPlatform;
  }

  try {
    if (process.platform === "win32") {
      cachedPlatform = "windows";
      return cachedPlatform;
    }

    if (process.platform === "darwin") {
      cachedPlatform = "macos";
      return cachedPlatform;
    }

    if (process.platform === "linux") {
      // 检查是否在 WSL 环境中
      try {
        const procVersion = readFileSync("/proc/version", "utf8").toLowerCase();
        if (procVersion.includes("microsoft") || procVersion.includes("wsl")) {
          cachedPlatform = "wsl";
          return cachedPlatform;
        }
      } catch {
        // /proc/version 不可读，按普通 Linux 处理
      }

      cachedPlatform = "linux";
      return cachedPlatform;
    }

    cachedPlatform = "unknown";
    return cachedPlatform;
  } catch {
    cachedPlatform = "unknown";
    return cachedPlatform;
  }
}

/** 便捷函数：是否为 Windows */
export function isWindows(): boolean {
  return getPlatform() === "windows";
}

/** 便捷函数：是否为 macOS */
export function isMacOS(): boolean {
  return getPlatform() === "macos";
}

/** 便捷函数：是否为 Linux（不含 WSL） */
export function isLinux(): boolean {
  return getPlatform() === "linux";
}

/** 便捷函数：是否为 WSL */
export function isWSL(): boolean {
  return getPlatform() === "wsl";
}

/** 便捷函数：是否为类 Unix 系统 */
export function isUnixLike(): boolean {
  const platform = getPlatform();
  return platform === "macos" || platform === "linux" || platform === "wsl";
}

/**
 * WSL 版本信息
 */
export type WSLVersion = "1" | "2" | "unknown";

let cachedWslVersion: WSLVersion | null = null;

/**
 * 获取 WSL 版本（仅在 WSL 环境下有效）
 */
export function getWSLVersion(): WSLVersion | undefined {
  if (getPlatform() !== "wsl") {
    return;
  }

  if (cachedWslVersion !== null) {
    return cachedWslVersion === "unknown" ? undefined : cachedWslVersion;
  }

  try {
    const procVersion = readFileSync("/proc/version", "utf8");

    // 检查明确的 WSL 版本标记（如 "WSL2"）
    const wslVersionMatch = procVersion.match(/WSL(\d+)/i);
    if (wslVersionMatch?.[1]) {
      cachedWslVersion = wslVersionMatch[1] as WSLVersion;
      return cachedWslVersion === "unknown" ? undefined : cachedWslVersion;
    }

    // 包含 "microsoft" 但没有版本号，通常是 WSL1
    if (procVersion.toLowerCase().includes("microsoft")) {
      cachedWslVersion = "1";
      return "1";
    }

    cachedWslVersion = "unknown";
  } catch {
    cachedWslVersion = "unknown";
  }
}

/**
 * Linux 发行版信息
 */
export interface LinuxDistroInfo {
  distroId?: string;
  distroVersion?: string;
  kernel?: string;
}

let cachedDistroInfo: LinuxDistroInfo | null = null;

/**
 * 获取 Linux 发行版信息
 */
export function getLinuxDistroInfo(): LinuxDistroInfo | undefined {
  if (!isLinux() && !isWSL()) {
    return;
  }

  if (cachedDistroInfo) {
    return cachedDistroInfo;
  }

  const info: LinuxDistroInfo = {
    kernel: process.version, // 简化处理，实际应使用 os.release()
  };

  try {
    const osRelease = readFileSync("/etc/os-release", "utf8");
    for (const line of osRelease.split("\n")) {
      const match = line.match(/^(ID|VERSION_ID)=(.*)$/);
      if (match?.[1] && match?.[2]) {
        const value = match[2].replace(/^"|"$/g, "");
        if (match[1] === "ID") {
          info.distroId = value;
        } else {
          info.distroVersion = value;
        }
      }
    }
  } catch {
    // /etc/os-release 可能不存在
  }

  cachedDistroInfo = info;
  return info;
}

/**
 * 重置缓存（主要用于测试）
 */
export function resetPlatformCache(): void {
  cachedPlatform = null;
  cachedWslVersion = null;
  cachedDistroInfo = null;
}
