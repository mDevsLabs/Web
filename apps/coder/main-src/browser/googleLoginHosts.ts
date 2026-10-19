/** 主进程与渲染进程共用的 Google 登录域名判断（不得 import electron）。 */

const GOOGLE_SENSITIVE_HOSTS = new Set([
  "accounts.google.com",
  "signin.google.com",
  "myaccount.google.com",
]);

export function isGoogleSensitiveHost(hostname: string): boolean {
  const host = String(hostname ?? "")
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");
  if (!host) {
    return false;
  }
  for (const suffix of GOOGLE_SENSITIVE_HOSTS) {
    if (host === suffix || host.endsWith(`.${suffix}`)) {
      return true;
    }
  }
  return false;
}

export function isGoogleLoginUrl(url: string): boolean {
  try {
    const parsed = new URL(String(url ?? "").trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    return isGoogleSensitiveHost(parsed.hostname);
  } catch {
    return false;
  }
}
