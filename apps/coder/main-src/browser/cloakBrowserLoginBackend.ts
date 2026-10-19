/**
 * CloakBrowser 集成评估（方案 C）
 *
 * CloakBrowser 的核心反检测在预编译 Chromium 二进制（C++ 补丁），Async 内置 Electron
 * webview 无法通过 JS 注入达到同等效果。若未来需要「在内置流程中完成 Google 登录」：
 *
 * 1. 添加可选依赖 `cloakbrowser`（npm）或调用本地 Python `cloakbrowser.launch_persistent_context`
 * 2. 检测到 Google 登录 URL 时启动独立隐身 Chromium（headed + humanize + geoip）
 * 3. 用户在 CloakBrowser 窗口完成登录；按需求导出 cookie 到 Async partition 或仅用于 Agent 会话
 *
 * 注意：BINARY-LICENSE 禁止反编译/再分发二进制；需用户自行安装 cloakbrowser 包。
 *
 * 当前产品策略：Google 账号登录走系统默认浏览器（见 googleLoginPolicy.ts），与设置页 OAuth 一致。
 */

/** 预留开关：设为 true 时可在后续迭代接入 CloakBrowser 独立登录窗口。 */
export const CLOAKBROWSER_LOGIN_BACKEND_ENABLED = false;

export type CloakBrowserLoginBackendStatus = {
  available: false;
  reason: "disabled-by-default" | "not-integrated";
  recommendedPath: "system-browser" | "cloakbrowser-persistent-context";
};

export function getCloakBrowserLoginBackendStatus(): CloakBrowserLoginBackendStatus {
  return {
    available: false,
    reason: CLOAKBROWSER_LOGIN_BACKEND_ENABLED
      ? "not-integrated"
      : "disabled-by-default",
    recommendedPath: "system-browser",
  };
}
