// Issue #10 — la politique du relais BFF : chemins fermés, jeton retiré des
// réponses. Aucun réseau ici : la fabrique de `Response` reste dans la route.
import { describe, expect, it } from "vitest";
import {
  resolveSiteBackendPath,
  stripSessionToken,
} from "@/lib/site/backend-relay";

describe("resolveSiteBackendPath", () => {
  it("accepte les chemins publics d'authentification", () => {
    for (const path of [
      "login",
      "register",
      "verify-login",
      "verify-register",
      "resend-code",
    ]) {
      expect(resolveSiteBackendPath([path])).toEqual({
        auth: "public",
        path: `/${path}`,
      });
    }
  });

  it("accepte les chemins de session, dont les segments multiples", () => {
    expect(resolveSiteBackendPath(["usage"])).toEqual({
      auth: "session",
      path: "/usage",
    });
    expect(resolveSiteBackendPath(["cloud", "storage"])).toEqual({
      auth: "session",
      path: "/cloud/storage",
    });
    expect(resolveSiteBackendPath(["v1", "audio", "usage"])).toEqual({
      auth: "session",
      path: "/v1/audio/usage",
    });
  });

  it("refuse tout le reste, sans détour ni chemin relatif", () => {
    expect(resolveSiteBackendPath(["admin"])).toBeNull();
    expect(resolveSiteBackendPath([])).toBeNull();
    expect(resolveSiteBackendPath(["..", "usage"])).toBeNull();
    expect(resolveSiteBackendPath(["usage", "..", "admin"])).toBeNull();
    expect(resolveSiteBackendPath(["cloud", "storage", "extra"])).toBeNull();
    expect(resolveSiteBackendPath(["%2e%2e"])).toBeNull();
    expect(resolveSiteBackendPath(["fichier.exe"])).toBeNull();
    expect(resolveSiteBackendPath(["a/b"])).toBeNull();
  });
});

describe("stripSessionToken", () => {
  it("retire le jeton de toute charge utile objet", () => {
    expect(stripSessionToken({ tier: "Free", token: "jwt" })).toEqual({
      tier: "Free",
    });
    expect(stripSessionToken({ success: true, token: "jwt" })).toEqual({
      success: true,
    });
  });

  it("ne casse pas les charges utiles non objet", () => {
    expect(stripSessionToken(null)).toBeNull();
    expect(stripSessionToken([1, 2])).toEqual([1, 2]);
    expect(stripSessionToken("texte")).toBe("texte");
  });
});
