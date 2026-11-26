import { describe, expect, it } from "vitest";
import {
  cheminSansBasePath,
  estPrefixeApiAutonome,
  estRouteApiAutonome,
  PREFIXES_API_AUTONOMES,
} from "@/lib/security/proxy-policy";

/**
 * Frontière d'authentification du middleware (`proxy.ts`).
 *
 * Vérifie dans les deux sens :
 *  - les routes publiques / autonomes légitimes (crons, statut Instatus,
 *    widgets GitHub, recherche publique, skills partagés) restent accessibles ;
 *  - l'exemption ne déborde JAMAIS sur une route privée ou supprimée (`/api/site/v1beta/`).
 */

describe("Proxy — préfixes autonomes réellement déclarés", () => {
  it("exempte v1, github, search, les crons et les skills partagés (sans v1beta)", () => {
    expect(PREFIXES_API_AUTONOMES).toContain("/api/site/v1/");
    expect(PREFIXES_API_AUTONOMES).not.toContain("/api/site/v1beta/");
    expect(PREFIXES_API_AUTONOMES).toContain("/api/site/github/");
    expect(PREFIXES_API_AUTONOMES).toContain("/api/site/search/");
    expect(PREFIXES_API_AUTONOMES).toContain("/api/cron/");
    expect(PREFIXES_API_AUTONOMES).toContain("/api/skills/share/");
  });

  it("n'exempte aucun préfixe approximatif", () => {
    for (const prefixe of PREFIXES_API_AUTONOMES) {
      expect(prefixe.endsWith("/")).toBe(true);
    }
  });
});

describe("Proxy — un client sans cookie atteint son endpoint public/autonome", () => {
  it.each([
    "/api/site/v1/status",
    "/api/cron/wakies",
    "/api/skills/share/abc123",
    "/api/site/github/stats?repo=mDevsLabs/CLI",
    "/api/site/search/query?q=mai",
  ])("%s est exempté", (pathname) => {
    const sansQuery = pathname.split("?")[0] ?? pathname;
    expect(estPrefixeApiAutonome(sansQuery)).toBe(true);
  });
});

describe("Proxy — l'exemption ne déborde pas sur le privé ni sur v1beta supprimé", () => {
  it.each([
    "/api/site/v1beta/models/gemini-2.0-flash:generateContent",
    "/api/site/v1beta",
    "/api/site/v1",
    "/api/site/v1evil/status",
    "/api/site/v1/../../account",
    "/api/site/v1/%2E%2E/account",
    "/api/site/v1/%2f%2e%2e/api/chats",
    "/API/site/v1/status",
    "/api/SITE/v1/status",
    "/api/site/support/upload",
    "/api/site/ollama/chat",
    "/api/wakies/tasks",
    "/api/chats",
  ])("%s n'est pas exempté", (pathname) => {
    expect(estPrefixeApiAutonome(pathname)).toBe(false);
  });
});

describe("Proxy — basePath du mode démo", () => {
  it("reconnaît un chemin portant le basePath", () => {
    expect(estRouteApiAutonome("/demo/api/site/v1/status", "/demo")).toBe(true);
    expect(estRouteApiAutonome("/api/site/v1/status", "/demo")).toBe(true);
  });

  it("ne retire le basePath que quand il est réellement présent", () => {
    expect(cheminSansBasePath("/demoapi/site", "/demo")).toBe("/demoapi/site");
    expect(cheminSansBasePath("/demo", "/demo")).toBe("/");
    expect(cheminSansBasePath("/demo/api/cron/wakies", "/demo")).toBe(
      "/api/cron/wakies"
    );
    expect(cheminSansBasePath("/api/site/v1/status", "")).toBe(
      "/api/site/v1/status"
    );
  });

  it("refuse la traversée une fois le basePath retiré", () => {
    expect(
      estRouteApiAutonome("/demo/api/site/v1/../../account", "/demo")
    ).toBe(false);
  });
});
