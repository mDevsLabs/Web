/**
 * Browser-fingerprint presets — coherent device profiles ported from
 * anything-analyzer. Each preset is a single click that fills the editor
 * with a self-consistent identity (platform / GPU / screen / cores / locale).
 */

import type { BrowserFingerprintSpoofSettings } from "./browserSidebarConfig.js";

export type BrowserFingerprintPreset = {
  id: string;
  label: string;
  description: string;
  settings: BrowserFingerprintSpoofSettings;
};

export const BROWSER_FINGERPRINT_PRESETS: BrowserFingerprintPreset[] = [
  {
    description: "Win32 / RTX-class GPU / 16-core / zh-CN",
    id: "win-nvidia",
    label: "Windows · NVIDIA · 1080p",
    settings: {
      availHeightOffset: 40,
      colorDepth: 24,
      deviceMemory: 16,
      devicePixelRatio: 1,
      hardwareConcurrency: 16,
      languages: "zh-CN, zh, en",
      maskWebdriver: true,
      platform: "Win32",
      screenHeight: 1080,
      screenWidth: 1920,
      timezone: "Asia/Shanghai",
      timezoneOffsetMinutes: -480,
      webglRenderer:
        "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)",
      webglVendor: "Google Inc. (NVIDIA)",
      webrtcPolicy: "block",
    },
  },
  {
    description: "Win32 / Intel UHD 770 / 8-core / en-US",
    id: "win-intel",
    label: "Windows · Intel UHD · 1080p",
    settings: {
      availHeightOffset: 40,
      colorDepth: 24,
      deviceMemory: 16,
      devicePixelRatio: 1,
      hardwareConcurrency: 8,
      languages: "en-US, en",
      maskWebdriver: true,
      platform: "Win32",
      screenHeight: 1080,
      screenWidth: 1920,
      timezone: "America/New_York",
      timezoneOffsetMinutes: 300,
      webglRenderer:
        "ANGLE (Intel, Intel(R) UHD Graphics 770 Direct3D11 vs_5_0 ps_5_0, D3D11)",
      webglVendor: "Google Inc. (Intel)",
      webrtcPolicy: "block",
    },
  },
  {
    description: "MacIntel / Apple M2 / 10-core / 2x DPR",
    id: "mac-arm",
    label: "macOS · Apple M2 · Retina",
    settings: {
      availHeightOffset: 25,
      colorDepth: 30,
      deviceMemory: 16,
      devicePixelRatio: 2,
      hardwareConcurrency: 10,
      languages: "en-US, en",
      maskWebdriver: true,
      platform: "MacIntel",
      screenHeight: 900,
      screenWidth: 1440,
      timezone: "America/Los_Angeles",
      timezoneOffsetMinutes: 480,
      webglRenderer: "ANGLE (Apple, Apple M2, OpenGL 4.1)",
      webglVendor: "Google Inc. (Apple)",
      webrtcPolicy: "block",
    },
  },
  {
    description: "MacIntel / Iris Plus / 8-core / en-US",
    id: "mac-intel",
    label: "macOS · Intel Iris · Retina",
    settings: {
      availHeightOffset: 25,
      colorDepth: 24,
      deviceMemory: 16,
      devicePixelRatio: 2,
      hardwareConcurrency: 8,
      languages: "en-US, en",
      maskWebdriver: true,
      platform: "MacIntel",
      screenHeight: 1050,
      screenWidth: 1680,
      timezone: "America/Los_Angeles",
      timezoneOffsetMinutes: 480,
      webglRenderer:
        "ANGLE (Intel, Intel(R) Iris Plus Graphics 645, OpenGL 4.1)",
      webglVendor: "Google Inc. (Intel)",
      webrtcPolicy: "block",
    },
  },
  {
    description: "Linux x86_64 / GTX 1080 Ti / 16-core",
    id: "linux-nvidia",
    label: "Linux · NVIDIA · 1080p",
    settings: {
      availHeightOffset: 40,
      colorDepth: 24,
      deviceMemory: 32,
      devicePixelRatio: 1,
      hardwareConcurrency: 16,
      languages: "en-US, en",
      maskWebdriver: true,
      platform: "Linux x86_64",
      screenHeight: 1080,
      screenWidth: 1920,
      timezone: "Europe/Berlin",
      timezoneOffsetMinutes: -60,
      webglRenderer: "ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 Ti, OpenGL 4.5)",
      webglVendor: "Google Inc. (NVIDIA)",
      webrtcPolicy: "block",
    },
  },
  {
    description: "Linux x86_64 / Mesa Intel UHD / 8-core",
    id: "linux-intel",
    label: "Linux · Intel UHD · 1080p",
    settings: {
      availHeightOffset: 40,
      colorDepth: 24,
      deviceMemory: 16,
      devicePixelRatio: 1,
      hardwareConcurrency: 8,
      languages: "en-GB, en",
      maskWebdriver: true,
      platform: "Linux x86_64",
      screenHeight: 1080,
      screenWidth: 1920,
      timezone: "Europe/London",
      timezoneOffsetMinutes: 0,
      webglRenderer:
        "ANGLE (Intel, Mesa Intel(R) UHD Graphics 630 (CFL GT2), OpenGL 4.5)",
      webglVendor: "Google Inc. (Intel)",
      webrtcPolicy: "block",
    },
  },
];

export function getBrowserFingerprintPreset(
  id: string
): BrowserFingerprintPreset | null {
  return BROWSER_FINGERPRINT_PRESETS.find((preset) => preset.id === id) ?? null;
}
