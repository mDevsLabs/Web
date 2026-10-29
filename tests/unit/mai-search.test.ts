import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  executeMaiSearch,
  filterBySafety,
  getYouApiKeys,
  looksFactual,
  type SearchWebHit,
} from "@/lib/search/you-client";

/**
 * Un résultat de recherche minimal, pour éprouver le filtre de sécurité
 * sans dépendre du moteur.
 */
function hit(title: string, snippet = ""): SearchWebHit {
  return {
    snippet,
    title,
    url: `https://exemple.fr/${encodeURIComponent(title)}`,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.YOU_API_KEY_1 = "test_key_1";
  process.env.YOU_API_KEY_2 = "test_key_2";
  process.env.YOU_API_KEY_3 = "test_key_3";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("mAI Search — Moteur You.com et Fallback", () => {
  it("récupère les clés YOU_API_KEY_1, YOU_API_KEY_2 et YOU_API_KEY_3 définies", () => {
    const keys = getYouApiKeys();
    expect(keys).toEqual(["test_key_1", "test_key_2", "test_key_3"]);
  });

  it("gère l'absence de clé ou échec You.com avec bascule sur le fallback Wikipedia", async () => {
    process.env.YOU_API_KEY_1 = "";
    process.env.YOU_API_KEY_2 = "";
    process.env.YOU_API_KEY_3 = "";

    // Le repli passe par `lib/search/wikipedia.ts` : l'API MediaWiki, et
    // non l'ancienne API `opensearch`. Le mock doit donc répondre dans le
    // format `list=search` (un objet), et non dans celui d'`opensearch`
    // (un tableau).
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (url) => {
        const urlStr = String(url);
        if (urlStr.includes("action=query") && urlStr.includes("list=search")) {
          return new Response(
            JSON.stringify({
              query: {
                search: [
                  {
                    snippet:
                      "L'intelligence artificielle est un ensemble de théories et de techniques...",
                    title: "Intelligence artificielle",
                  },
                ],
              },
            }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
          );
        }
        if (urlStr.includes("prop=extracts")) {
          return new Response(
            JSON.stringify({
              query: {
                pages: [
                  {
                    extract:
                      "L'intelligence artificielle est un ensemble de théories et de techniques d'informatique.",
                    fullurl:
                      "https://fr.wikipedia.org/wiki/Intelligence_artificielle",
                    title: "Intelligence artificielle",
                  },
                ],
              },
            }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
          );
        }
        return new Response("Not Found", { status: 404 });
      });

    const results = await executeMaiSearch({
      query: "intelligence artificielle",
      type: "web",
    });

    expect(results.results.length).toBeGreaterThan(0);
    expect(results.results[0].title).toBe("Intelligence artificielle");
    expect(results.results[0].url).toContain("wikipedia.org");
    // Le repli puise dans le MÊME module que la source « Wikipédia » :
    // ses résultats portent donc cette origine, et l'interface n'affiche
    // pas « Mode dégradé » pour des articles d'encyclopédie normaux.
    expect(results.provider).toBe("wikipedia");
    expect(results.results[0].origin).toBe("wikipedia");

    fetchMock.mockRestore();
  });

  it("effectue une recherche You.com réussie lorsque l'API répond", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            hits: [
              {
                description: "Official Next.js documentation and guide.",
                snippets: ["Next.js 16 introduces new features..."],
                title: "Next.js 16 Documentation",
                url: "https://nextjs.org/docs",
              },
            ],
          }),
          { headers: { "Content-Type": "application/json" }, status: 200 }
        )
    );

    const results = await executeMaiSearch({
      query: "Next.js 16",
      type: "web",
    });

    expect(results.results.length).toBe(1);
    expect(results.results[0].title).toBe("Next.js 16 Documentation");
    expect(results.results[0].url).toBe("https://nextjs.org/docs");
    expect(results.provider).toBe("you.com");

    fetchMock.mockRestore();
  });
});

describe("mAI Search — les clés sont essayées en parallèle", () => {
  it("n'attend pas qu'une clé expirée bloque les autres", async () => {
    // La première clé ne répond jamais : elle expire après son délai. La
    // deuxième répond immédiatement. Si les clés étaient essayées l'une
    // après l'autre, la recherche attendrait le délai de la première.
    process.env.YOU_API_KEY_1 = "cle_morte";
    process.env.YOU_API_KEY_2 = "cle_bonne";
    process.env.YOU_API_KEY_3 = "";

    let appelsEnParallele = 0;
    let maximumSimultane = 0;
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (_url, init) => {
        const cle = (init?.headers as Record<string, string>)?.["X-API-Key"];
        if (cle === "cle_morte") {
          // Cette clé « pend » : elle ne résout jamais avant le délai.
          await new Promise((resolve) => setTimeout(resolve, 50));
          return new Response("Not Found", { status: 404 });
        }
        appelsEnParallele += 1;
        maximumSimultane = Math.max(maximumSimultane, appelsEnParallele);
        return new Response(
          JSON.stringify({
            hits: [
              {
                description: "Un résultat.",
                title: "Résultat",
                url: "https://exemple.fr/resultat",
              },
            ],
          }),
          { headers: { "Content-Type": "application/json" }, status: 200 }
        );
      });

    const results = await executeMaiSearch({
      count: 5,
      query: "Test parallèle",
      sources: ["web"],
    });

    // Le résultat de la clé bonne a été rendu.
    expect(results.results.length).toBeGreaterThan(0);
    // Et les deux clés ont été interrogées EN MÊME TEMPS : la clé morte
    // n'a pas bloqué la bonne.
    expect(maximumSimultane).toBeGreaterThan(1);

    fetchMock.mockRestore();
  });
});

describe("mAI Search — Wikipédia comme source à part entière", () => {
  it("ajoute les articles Wikipédia aux résultats web et marque leur origine", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (url) => {
        const urlStr = String(url);
        // Recherche d'articles MediaWiki
        if (urlStr.includes("action=query") && urlStr.includes("list=search")) {
          return new Response(
            JSON.stringify({
              query: {
                search: [
                  {
                    snippet:
                      'Ada <span class="searchmatch">Lovelace</span> est une mathématicienne britannique.',
                    timestamp: "2025-01-15T10:00:00Z",
                    title: "Ada Lovelace",
                  },
                ],
              },
            }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
          );
        }
        // Résumé d'article
        if (urlStr.includes("prop=extracts")) {
          return new Response(
            JSON.stringify({
              query: {
                pages: [
                  {
                    extract:
                      "Ada Lovelace est une mathématicienne britannique, connue pour ses travaux sur la machine analytique de Charles Babbage.",
                    fullurl: "https://fr.wikipedia.org/wiki/Ada_Lovelace",
                    title: "Ada Lovelace",
                  },
                ],
              },
            }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
          );
        }
        if (urlStr.includes("ydc-index.io") || urlStr.includes("api.you.com")) {
          return new Response(
            JSON.stringify({
              hits: [
                {
                  description: "Un blog qui parle de Ada Lovelace.",
                  title: "Ada Lovelace, une pionnière",
                  url: "https://blog.exemple.fr/ada-lovelace",
                },
              ],
            }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
          );
        }
        return new Response("Not Found", { status: 404 });
      });

    const results = await executeMaiSearch({
      count: 10,
      query: "Ada Lovelace",
      sources: ["web", "wikipedia"],
    });

    const wiki = results.results.find(
      (r) => r.origin === "wikipedia" && r.title === "Ada Lovelace"
    );
    expect(wiki).toBeDefined();
    expect(wiki?.url).toBe("https://fr.wikipedia.org/wiki/Ada_Lovelace");
    // Le résumé de l'article alimente l'extrait affiché.
    expect(wiki?.snippet).toContain("mathématicienne britannique");
    // Le résultat web est conservé, avec son origine par défaut.
    expect(
      results.results.some(
        (r) => r.url === "https://blog.exemple.fr/ada-lovelace"
      )
    ).toBe(true);
    // Deux moteurs ont répondu : le fournisseur est composite.
    expect(results.provider).toBe("mixed");

    fetchMock.mockRestore();
  });

  it("ne duplique pas un article déjà présent dans les résultats web", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (url) => {
        const urlStr = String(url);
        if (urlStr.includes("action=query") && urlStr.includes("list=search")) {
          return new Response(
            JSON.stringify({
              query: {
                search: [
                  {
                    snippet: "Un article sur le sujet.",
                    title: "Sujet",
                  },
                ],
              },
            }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
          );
        }
        if (urlStr.includes("prop=extracts")) {
          return new Response(
            JSON.stringify({
              query: {
                pages: [
                  {
                    extract: "Le résumé de l'article.",
                    fullurl: "https://fr.wikipedia.org/wiki/Sujet",
                    title: "Sujet",
                  },
                ],
              },
            }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
          );
        }
        if (urlStr.includes("ydc-index.io")) {
          return new Response(
            JSON.stringify({
              hits: [
                {
                  description: "La même page, déjà connue.",
                  title: "Sujet",
                  url: "https://fr.wikipedia.org/wiki/Sujet",
                },
              ],
            }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
          );
        }
        return new Response("Not Found", { status: 404 });
      });

    const results = await executeMaiSearch({
      count: 10,
      query: "Sujet",
      sources: ["web", "wikipedia"],
    });

    const occurrences = results.results.filter(
      (r) => r.url === "https://fr.wikipedia.org/wiki/Sujet"
    );
    expect(occurrences).toHaveLength(1);
    // L'article reste identifiable même s'il est arrivé d'abord par le
    // moteur web : sinon l'onglet Wikipédia ne peut pas l'afficher.
    expect(occurrences[0]?.origin).toBe("wikipedia");

    fetchMock.mockRestore();
  });

  it("ne fait jamais échouer la recherche quand Wikipédia est muette", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (url) => {
        const urlStr = String(url);
        if (urlStr.includes("wikipedia.org")) {
          return new Response("Service indisponible", { status: 503 });
        }
        if (urlStr.includes("ydc-index.io")) {
          return new Response(
            JSON.stringify({
              hits: [
                {
                  description: "Un résultat.",
                  title: "Résultat",
                  url: "https://exemple.fr/resultat",
                },
              ],
            }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
          );
        }
        return new Response("Not Found", { status: 404 });
      });

    const results = await executeMaiSearch({
      count: 10,
      query: "Sujet quelconque",
      sources: ["web", "wikipedia"],
    });

    expect(results.results.length).toBeGreaterThan(0);
    expect(results.success).toBe(true);
    expect(results.results.some((r) => r.origin === "wikipedia")).toBe(false);

    fetchMock.mockRestore();
  });
});

describe("mAI Search — filtre de sécurité", () => {
  it("ne filtre rien en mode « aucun »", () => {
    const hits = [hit("Un article"), hit("Contenu sensible pornographique")];
    expect(filterBySafety(hits, "low")).toHaveLength(2);
  });

  it("retire les résultats sensibles en mode « strict »", () => {
    const hits = [
      hit("Un article normal"),
      hit("Vidéo pornographique", "porn"),
    ];
    const filtres = filterBySafety(hits, "strict");
    expect(filtres).toHaveLength(1);
    expect(filtres[0].title).toBe("Un article normal");
  });

  it("conserve une mention isolée en mode « modéré »", () => {
    // Un terme isolé peut être une mention innocente : le mode modéré ne
    // retire que les cas où le terme revient.
    const hits = [
      hit("Un article qui cite un film X-rated", "porn"),
      hit("Un autre article", "porn et nsfw"),
    ];
    const filtres = filterBySafety(hits, "medium");
    expect(filtres).toHaveLength(1);
    expect(filtres[0].title).toBe("Un article qui cite un film X-rated");
  });
});

describe("mAI Search — détection de requête factuelle", () => {
  it("reconnaît les questions et les noms propres", () => {
    expect(looksFactual("Qui est Ada Lovelace ?")).toBe(true);
    expect(looksFactual("Tour Eiffel")).toBe(true);
    expect(looksFactual("comment faire une sauce")).toBe(true);
  });

  it("ne confond pas une recherche d'actualité d'une question", () => {
    expect(looksFactual("météo demain")).toBe(false);
    expect(looksFactual("")).toBe(false);
  });
});
