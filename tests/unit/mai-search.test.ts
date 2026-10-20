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

    // Mock fetch pour simuler le fallback Wikipedia
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (url) => {
        const urlStr = String(url);
        if (urlStr.includes("wikipedia.org")) {
          return new Response(
            JSON.stringify([
              "intelligence artificielle",
              ["Intelligence artificielle"],
              [
                "L'intelligence artificielle est un ensemble de théories et de techniques...",
              ],
              ["https://fr.wikipedia.org/wiki/Intelligence_artificielle"],
            ]),
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
    expect(results.provider).toBe("fallback");

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
