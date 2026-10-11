import { describe, expect, it } from "vitest";
import {
  cheminSansBasePath,
  estPrefixeApiAutonome,
  estRouteApiAutonome,
  PREFIXES_API_AUTONOMES,
} from "@/lib/security/proxy-policy";

/**
 * Frontière d'authentification du middleware.
 *
 * Régression : l'API Google-compatible `/api/site/v1beta/**` s'authentifie par
 * clé Bearer et n'envoie jamais de cookie. `proxy.ts` n'exemptait que
 * `/api/site/v1/` : la requête d'un client externe était arrêtée par un 401
 * `auth_required` du middleware, avant d'atteindre le handler qui aurait validé
 * sa clé. L'API était injoignable alors qu'elle était correcte.
 *
 * La politique est extraite dans `lib/security/proxy-policy.ts` (module pur,
 * aucune dépendance à `next/server`) précisément pour que cette frontière soit
 * testable sans monter un runtime Next — aucun test du dépôt n'importe `proxy`.
 *
 * Ce qu'on vérifie ici, dans les deux sens :
 *  - les clients non-navigateurs légitimes atteignent bien leur endpoint ;
 *  - l'exemption ne déborde JAMAIS sur une route privée. Une exemption trop
 *    large n'est pas un bug visible : c'est une porte.
 */

describe("Proxy — préfixes autonomes réellement déclarés", () => {
  it("exempte v1, v1beta, les crons et les skills partagés", () => {
    expect(PREFIXES_API_AUTONOMES).toContain("/api/site/v1/");
    expect(PREFIXES_API_AUTONOMES).toContain("/api/site/v1beta/");
    expect(PREFIXES_API_AUTONOMES).toContain("/api/cron/");
    expect(PREFIXES_API_AUTONOMES).toContain("/api/skills/share/");
  });

  it("n'exempte aucun préfixe approximatif", () => {
    // Le `/` final fait partie de la clé.
    for (const prefixe of PREFIXES_API_AUTONOMES) {
      expect(prefixe.endsWith("/")).toBe(true);
    }
  });
});

describe("Proxy — un client sans cookie atteint son endpoint", () => {
  it.each([
    "/api/site/v1beta/models/gemini-2.0-flash:generateContent",
    "/api/site/v1beta/models/poolside/laguna-xs-2.1:free:generateContent",
    "/api/site/v1/chat/completions",
    "/api/site/v1/models",
    "/api/site/v1/status",
    "/api/cron/wakies",
    "/api/skills/share/abc123",
    "/api/site/github/stats?repo=mDevsLabs/CLI",
  ])("%s est exempté", (pathname) => {
    // La query string ne fait pas partie du pathname Next ; on la retire comme
    // le ferait le middleware.
    const sansQuery = pathname.split("?")[0] ?? pathname;
    expect(estPrefixeApiAutonome(sansQuery)).toBe(true);
  });
});

describe("Proxy — l'exemption ne déborde pas sur le privé", () => {
  it.each([
    // Sans le slash final : une autre route qui « ressemble ».
    "/api/site/v1beta",
    "/api/site/v1betaevil",
    "/api/site/v1betax/models",
    "/api/site/v1",
    "/api/site/v1evil/status",
    // Traversée et échappement : on ne sait pas ce que le routeur en fera après
    // décodage, donc rien n'est exempté — le client devra son cookie.
    "/api/site/v1beta/../../account/keys",
    "/api/site/v1beta/%2E%2E/account/keys",
    "/api/site/v1beta/%2f%2e%2e/api/chats",
    // Casse : une URL en majuscules ne correspond pas et retombe sur le chemin
    // authentifié. Échec sûr par construction.
    "/API/site/v1beta/models",
    "/api/SITE/v1/models",
    // Routes de compte du Site : elles exigent la session, comme partout.
    "/api/site/dev-keys",
    "/api/site/account/api-executor",
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
    expect(estRouteApiAutonome("/demo/api/site/v1beta/models/x", "/demo")).toBe(
      true
    );
    expect(estRouteApiAutonome("/api/site/v1beta/models/x", "/demo")).toBe(
      true
    );
  });

  it("ne retire le basePath que quand il est réellement présent", () => {
    // Un chemin qui commence par /demo sans être suivi d'un slash n'est pas
    // préfixé par le basePath : `/demoapi/...` n'est pas `/demo` + `api/...`.
    expect(cheminSansBasePath("/demoapi/site", "/demo")).toBe("/demoapi/site");
    expect(cheminSansBasePath("/demo", "/demo")).toBe("/");
    expect(cheminSansBasePath("/demo/api/cron/wakies", "/demo")).toBe(
      "/api/cron/wakies"
    );
    // Sans basePath configuré, le chemin est rendu tel quel.
    expect(cheminSansBasePath("/api/site/v1/models", "")).toBe(
      "/api/site/v1/models"
    );
  });

  it("refuse la même traversée une fois le basePath retiré", () => {
    expect(
      estRouteApiAutonome("/demo/api/site/v1beta/../../account", "/demo")
    ).toBe(false);
  });
});
