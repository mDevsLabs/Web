// Les lectures en erreur et les filtres vides ne doivent pas masquer les pannes.
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { countQuickSearchResults } from "@/lib/chat/quick-search";
import { readJson } from "@/lib/client/read-json";

afterEach(() => vi.unstubAllGlobals());

describe("lecture des données de la palette et de la mémoire", () => {
  it("retourne les données d'une réponse valide", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ memories: [] }))
    );
    await expect(readJson("/api/memory")).resolves.toEqual({ memories: [] });
  });

  it.each([
    { error: "Session expirée" },
    { error: { message: "Session expirée" } },
    { message: "Session expirée" },
  ])("conserve le message d'une erreur HTTP", async (body) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json(body, { status: 401 }))
    );
    await expect(readJson("/api/memory")).rejects.toThrow("Session expirée");
  });

  it("refuse une réponse HTML même avec un statut 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>Erreur</html>"))
    );
    await expect(readJson("/api/search")).rejects.toThrow(
      "Impossible de charger"
    );
  });

  it("propage une panne réseau sans la transformer en liste vide", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Connexion interrompue"))
    );
    await expect(readJson("/api/memory")).rejects.toThrow(
      "Connexion interrompue"
    );
  });
});

describe("comptage des résultats visibles", () => {
  const results = { chats: [1, 2], files: [], messages: [3], projects: [4] };
  it("compte toutes les catégories", () => {
    expect(countQuickSearchResults(results, "all")).toBe(4);
  });
  it("signale une catégorie vide même si d'autres ont des résultats", () => {
    expect(countQuickSearchResults(results, "files")).toBe(0);
  });
  it("compte uniquement la catégorie sélectionnée", () => {
    expect(countQuickSearchResults(results, "chats")).toBe(2);
  });
});

describe("contrats de navigation et d'accessibilité", () => {
  it("monte la palette hors de la barre latérale mobile démontable", () => {
    const source = readFileSync("components/chat/app-sidebar.tsx", "utf8");
    expect(source.indexOf("<SearchDialog />")).toBeGreaterThan(
      source.indexOf("</Sidebar>")
    );
  });
  it("conserve les correspondances du serveur sans un second filtrage cmdk", () => {
    const source = readFileSync("components/chat/search-dialog.tsx", "utf8");
    expect(source).toContain("shouldFilter={false}");
    expect(source).toContain("100dvh-2rem");
  });
  it("isole les réponses par saisie et masque les résultats durant le debounce", () => {
    const source = readFileSync("hooks/use-quick-search.ts", "utf8");
    expect(source).toContain("normalizedQuery === debouncedQuery");
    expect(source).toContain("data: current ? data : undefined");
    expect(source).toContain("encodeURIComponent(normalizedQuery)");
  });
  it("ne resynchronise pas un clic de réglages avec l'ancienne URL", () => {
    const source = readFileSync("app/(chat)/settings/page.tsx", "utf8");
    expect(source).not.toContain("[searchParams, activeTab]");
    expect(source).toContain('inline: "nearest"');
    expect(source).toContain('htmlFor="settings-custom-instructions"');
  });
});
