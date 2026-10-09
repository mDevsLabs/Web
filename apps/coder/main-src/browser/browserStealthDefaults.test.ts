import { describe, expect, it } from "vitest";
import {
  buildChromeLikeUserAgent,
  getDefaultBrowserFingerprintForPlatform,
} from "./browserStealthDefaults.js";
import { isGoogleLoginUrl, isGoogleSensitiveHost } from "./googleLoginHosts.js";
import { openGoogleLoginInSystemBrowser } from "./googleLoginPolicy.js";

describe("buildChromeLikeUserAgent", () => {
  it("does not include Electron in the UA string", () => {
    const ua = buildChromeLikeUserAgent("134.0.6998.88");
    expect(ua).toContain("Chrome/134.0.6998.88");
    expect(ua).not.toContain("Electron/");
  });

  it("uses Windows NT token on win32", () => {
    const ua = buildChromeLikeUserAgent("134.0.0.0");
    if (process.platform === "win32") {
      expect(ua).toContain("Windows NT 10.0");
    }
  });
});

describe("getDefaultBrowserFingerprintForPlatform", () => {
  it("enables maskWebdriver by default", () => {
    const fp = getDefaultBrowserFingerprintForPlatform();
    expect(fp.maskWebdriver).toBe(true);
    expect(fp.webrtcPolicy).toBeUndefined();
  });
});

describe("googleLoginPolicy", () => {
  it("detects Google sign-in hosts", () => {
    expect(isGoogleSensitiveHost("accounts.google.com")).toBe(true);
    expect(isGoogleSensitiveHost("signin.google.com")).toBe(true);
    expect(isGoogleSensitiveHost("www.google.com")).toBe(false);
  });

  it("detects Google sign-in URLs", () => {
    expect(
      isGoogleLoginUrl("https://accounts.google.com/o/oauth2/v2/auth")
    ).toBe(true);
    expect(isGoogleLoginUrl("https://example.com/login")).toBe(false);
  });

  it("rejects unsupported google login open targets", async () => {
    const result = await openGoogleLoginInSystemBrowser(
      "https://example.com/login"
    );
    expect(result.ok).toBe(false);
  });
});
