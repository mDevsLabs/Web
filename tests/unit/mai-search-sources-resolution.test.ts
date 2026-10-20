import { describe, expect, it } from "vitest";
import { resolveSources } from "@/app/(chat)/api/mai-search/route";
import { MAI_SEARCH_SOURCE_KEYS } from "@/lib/search/sources";

/**
 * La préférence des sources est un PLAFOND.
 *
 * Ce fichier verrouille la règle qui rend les onglets « Actualités » et
 * « Images » possibles SANS qu'un appel direct puisse contourner le
 * réglage « sources activées » du compte.
 */
describe("résolution des sources de recherche", () => {
  it("rend toutes les sources quand le compte n'a aucune préférence", () => {
    expect(resolveSources({ preferences: null })).toEqual([
      ...MAI_SEARCH_SOURCE_KEYS,
    ]);
  });

  it("rend les sources autorisées quand le client ne demande rien", () => {
    expect(
      resolveSources({ preferences: { searchSources: ["web", "news"] } })
    ).toEqual(["web", "news"]);
  });

  it("laisse le client RÉTRÉCIR le périmètre", () => {
    // C'est ce qui rend l'onglet « Actualités » possible : le client
    // demande l'actualité seule, et le serveur rend cette actualité seule.
    expect(
      resolveSources({
        preferences: { searchSources: ["web", "news", "images"] },
        requested: ["news"],
      })
    ).toEqual(["news"]);
  });

  it("empêche le client d'ÉLARGIR le périmètre", () => {
    // Les images sont désactivées dans le compte : les demander ne doit
    // pas les faire revenir.
    expect(
      resolveSources({
        preferences: { searchSources: ["web"] },
        requested: ["web", "images"],
      })
    ).toEqual(["web"]);
  });

  it("rend le plafond quand la demande ne laisse rien", () => {
    // L'onglet « Images » alors que les images sont désactivées ne doit
    // pas rendre une recherche VIDE : c'est un échec silencieux. On rend
    // les sources autorisées, qui restent utiles.
    expect(
      resolveSources({
        preferences: { searchSources: ["web"] },
        requested: ["images"],
      })
    ).toEqual(["web"]);
  });

  it("honore le paramètre historique `type`", () => {
    expect(resolveSources({ preferences: null, type: "images" })).toEqual([
      "images",
    ]);
    expect(resolveSources({ preferences: null, type: "web" })).toEqual(["web"]);
  });

  it("retombe sur le plafond quand la demande est illisible", () => {
    // Une source fantôme ne doit jamais atteindre le moteur.
    expect(
      resolveSources({
        preferences: { searchSources: ["web", "news"] },
        requested: ["fantome"],
      })
    ).toEqual(["web", "news"]);
  });

  it("ne laisse passer aucune source inconnue", () => {
    const resultat = resolveSources({
      preferences: { searchSources: ["web", "fantome"] },
      requested: ["images", "autre-chose"],
    });
    for (const source of resultat) {
      expect(MAI_SEARCH_SOURCE_KEYS).toContain(source);
    }
  });
});
