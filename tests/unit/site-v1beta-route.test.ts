import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { estRouteApiAutonome } from "@/lib/security/proxy-policy";

/**
 * Le endpoint Google-compatible `/api/site/v1beta/models/**`.
 *
 * Deux garanties à tenir ensemble, sous peine de corriger le 401 du middleware
 * en ouvrant une route privée :
 *
 *  1. le chemin est exempté de l'exigence de cookie (défaut n° 5 de la revue :
 *     un client sans cookie ne l'atteignait jamais) ;
 *  2. le handler refuse tout de même sans Bearer, et ne relaye que ce qu'il sait
 *     être un identifiant de modèle. L'exemption retire l'exigence du cookie,
 *     jamais l'authentification.
 *
 * Le segment est un catch-all parce que l'allowlist de l'exécuteur publie des
 * identifiants à plusieurs segments (`lib/site/api-key-routes.ts:299`), qu'un
 * `[model]` simple ne pouvait pas servir.
 */

function requete(
  chemin = "http://localhost/api/site/v1beta/models/m"
): NextRequest {
  return new NextRequest(chemin, {
    body: "{}",
    headers: { authorization: "Bearer cle-test" },
    method: "POST",
  });
}

function params(...model: string[]) {
  return { params: Promise.resolve({ model }) };
}

// Le chargement de `next/server` — imported par la route — coûte plusieurs
// secondes. Il était auparavant payé par le PREMIER test qui importait la
// route, donc chronométré : le test passait ou échouait selon la machine et
// la version de Next. On le déclenche ici, à la collecte du fichier, où le
// délai de test ne s'applique pas : plus aucun test n'est chronométré sur un
// chargement de module.
await import("@/app/(chat)/api/site/v1beta/models/[...model]/route");

describe("v1beta — frontière d'authentification", () => {
  it.each([
    "/api/site/v1beta/models/gemini-2.0-flash:generateContent",
    "/api/site/v1beta/models/poolside/laguna-xs-2.1:free:generateContent",
  ])("est atteignable sans cookie depuis %s", (pathname) => {
    expect(estRouteApiAutonome(pathname, "")).toBe(true);
  });

  it("refuse une requête sans Bearer", async () => {
    const { POST } = await import(
      "@/app/(chat)/api/site/v1beta/models/[...model]/route"
    );
    const reponse = await POST(
      new NextRequest("http://localhost/api/site/v1beta/models/m", {
        body: "{}",
        method: "POST",
      }),
      params("gemini-2.0-flash")
    );
    expect(reponse.status).toBe(401);
  });

  it("refuse un schéma d'autorisation méconnu", async () => {
    const { POST } = await import(
      "@/app/(chat)/api/site/v1beta/models/[...model]/route"
    );
    const reponse = await POST(
      new NextRequest("http://localhost/api/site/v1beta/models/m", {
        body: "{}",
        headers: { authorization: "Bearer" },
        method: "POST",
      }),
      params("gemini-2.0-flash")
    );
    expect(reponse.status).toBe(401);
  });
});

describe("v1beta — relais vers l'amont", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reconstruit l'identifiant à plusieurs segments et relaye le jeton", async () => {
    const { POST } = await import(
      "@/app/(chat)/api/site/v1beta/models/[...model]/route"
    );
    const jeton = "mai-pro-0123456789abcdef0123456789abcdef";
    const reponse = await POST(
      new NextRequest("http://localhost/api/site/v1beta/models/x", {
        body: "{}",
        headers: { authorization: `Bearer ${jeton}` },
        method: "POST",
      }),
      params("poolside", "laguna-xs-2.1:free:generateContent")
    );
    expect(reponse.status).toBe(200);

    const appel = fetchMock.mock.calls[0];
    expect(appel, "aucun appel à l'amont").toBeDefined();
    const url = String(appel?.[0]);
    expect(url).toContain(
      "/v1beta/models/poolside/laguna-xs-2.1:free:generateContent"
    );
    // Aucun percent-encodage : `encodeURIComponent` transformerait les `:` en
    // `%3A` et l'API Google refuserait l'appel.
    expect(url).not.toContain("%3A");
    const options = appel?.[1] as { headers: Record<string, string> };
    expect(options.headers.Authorization).toBe(`Bearer ${jeton}`);
  });

  it("relaye la query string, dont `alt=sse`", async () => {
    const { POST } = await import(
      "@/app/(chat)/api/site/v1beta/models/[...model]/route"
    );
    await POST(
      new NextRequest(
        "http://localhost/api/site/v1beta/models/x:streamGenerateContent?alt=sse",
        {
          body: "{}",
          headers: { authorization: "Bearer cle-test" },
          method: "POST",
        }
      ),
      params("x:streamGenerateContent")
    );
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("alt=sse");
  });

  it("ne transforme pas un flux en JSON", async () => {
    const corps = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: {}\n\n"));
        controller.close();
      },
    });
    fetchMock.mockResolvedValueOnce(
      new Response(corps, {
        headers: { "content-type": "text/event-stream" },
        status: 200,
      })
    );
    const { POST } = await import(
      "@/app/(chat)/api/site/v1beta/models/[...model]/route"
    );
    const reponse = await POST(requete(), params("gemini-2.0-flash"));
    expect(reponse.headers.get("content-type")).toContain("text/event-stream");
  });

  it("refuse un identifiant de modèle malformé avant toute sortie réseau", async () => {
    const { POST } = await import(
      "@/app/(chat)/api/site/v1beta/models/[...model]/route"
    );
    for (const mauvais of [
      // Traversée du chemin amont : le premier caractère alphanumérique exigé
      // l'écarte par construction, sans liste noire.
      ["..", "..", "etc", "passwd"],
      ["..%2f..%2fetc"],
      ["a\nb"],
      ["<script>"],
      [" segment "],
      ["point.", "."],
    ]) {
      const reponse = await POST(requete(), params(...mauvais));
      // 404 `model_not_found`, comme la route v1 sœur : on ne dit pas au client
      // si un modèle existe, et une entrée malformée n'en désigne aucun.
      expect(reponse.status, `accepté : ${mauvais.join("/")}`).toBe(404);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rend 404 quand le segment catch-all est vide", async () => {
    const { POST } = await import(
      "@/app/(chat)/api/site/v1beta/models/[...model]/route"
    );
    const reponse = await POST(requete(), params());
    expect(reponse.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ne publie pas le détail technique de sa propre panne", async () => {
    const espion = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED 10.0.0.5:5432"));
    const { POST } = await import(
      "@/app/(chat)/api/site/v1beta/models/[...model]/route"
    );
    const reponse = await POST(requete(), params("gemini-2.0-flash"));
    expect(reponse.status).toBe(500);
    const texte = JSON.stringify(await reponse.json());
    // Une exception peut porter une URL interne, un fragment de jeton ou une
    // adresse de réseau : le client ne reçoit qu'un message français générique.
    expect(texte).not.toContain("ECONNREFUSED");
    expect(texte).not.toContain("10.0.0.5");
    expect(espion).toHaveBeenCalled();
    espion.mockRestore();
  });
});
