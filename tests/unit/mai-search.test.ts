import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeMaiSearch, getYouApiKeys } from "@/lib/search/you-client";

describe("mAI Search - Moteur You.com et Fallback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.YOU_API_KEY_1 = "test_key_1";
    process.env.YOU_API_KEY_2 = "test_key_2";
    process.env.YOU_API_KEY_3 = "test_key_3";
  });

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
