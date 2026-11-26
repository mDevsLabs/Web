import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { OFFICIAL_APPS, WEB_RELEASE_URL } from "@/lib/site/downloads-data";
import { maiModelsList } from "@/lib/site/mai-models";
import { modelsData } from "@/lib/site/models-data";
import { getNewsArticles } from "@/lib/site/news";

const ROOT = resolve(import.meta.dirname, "..", "..");

function readRepoFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), "utf8");
}

describe("Mises à jour BlackLine et Site (novembre 2026)", () => {
  it("remplace les boutons sombres BlackLine par des boutons natifs lisibles", () => {
    const ageGate = readRepoFile("components/blackline/age-gate.tsx");
    const host = readRepoFile("components/blackline/blackline-host.tsx");

    expect(ageGate).not.toContain("<Button");
    expect(ageGate).toContain("text-white");
    expect(ageGate).toContain("bg-[#c6dd94]");
    expect(host).toContain(
      'type="button"\n              >\n                Annuler'
    );
  });

  it("synchronise les menus déroulants du site sans persistance group-focus-within", () => {
    const desktopNav = readRepoFile(
      "components/site/navbar/desktop-navigation.tsx"
    );
    const accountMenu = readRepoFile("components/site/navbar/account-menu.tsx");

    expect(desktopNav).not.toContain("group-focus-within");
    expect(desktopNav).toContain('isOpen ? "rotate-180" : ""');
    expect(accountMenu).not.toContain("group-focus-within");
    expect(accountMenu).toContain('isOpen ? "rotate-180" : ""');
  });

  it("positionne la date de sortie mAI-2.5 sur 12/2026", () => {
    const modelsPage = readRepoFile("app/(chat)/site/models/page.tsx");
    for (const id of ["mai-2.5-opal", "mai-2.5-apex", "mai-2.5-omni"]) {
      const card = modelsData.find((m) => m.id === id);
      const apiModel = maiModelsList.find((m) => m.id === id);
      expect(card?.releaseDate).toBe("12/2026");
      expect(apiModel?.releaseDate).toBe("2026-12");
    }
    expect(modelsPage).not.toContain('releaseDate: "19/11/2026"');
    expect(modelsPage).toContain('releaseDate: "12/2026"');
  });

  it("limite les applications de Téléchargements à Desktop, Coder et Vibe vers Web/releases/latest", () => {
    expect(WEB_RELEASE_URL).toBe(
      "https://github.com/mDevsLabs/Web/releases/latest"
    );
    expect(OFFICIAL_APPS.map((app) => app.id)).toEqual([
      "desktop",
      "coder",
      "vibe",
    ]);

    const expectedPlatforms: Record<string, string[]> = {
      coder: ["macOS", "Windows", "Linux"],
      desktop: ["macOS", "Windows", "Linux", "Android", "iOS"],
      vibe: ["Android", "iOS"],
    };

    for (const app of OFFICIAL_APPS) {
      expect(app.releaseUrl).toBe(WEB_RELEASE_URL);
      expect(app.platforms?.map((p) => p.label)).toEqual(
        expectedPlatforms[app.id]
      );
      for (const platform of app.platforms ?? []) {
        expect(platform.url).toBe(WEB_RELEASE_URL);
      }
    }
  });

  it("publie les deux articles d'annonce sur l'arrêt de l'API et la fin des mises à jour de mAI CLI", () => {
    const articles = getNewsArticles();
    const apiArticle = articles.find(
      (article) => article.slug === "arret-api-mai-decembre-2026"
    );
    const cliArticle = articles.find(
      (article) => article.slug === "fin-mises-a-jour-mai-cli"
    );

    expect(apiArticle).toBeDefined();
    expect(apiArticle?.date).toBe("2026-11-23");
    expect(apiArticle?.visibility).toBe("featured");
    expect(apiArticle?.content).toContain("10 décembre 2026");

    expect(cliArticle).toBeDefined();
    expect(cliArticle?.date).toBe("2026-11-23");
    expect(cliArticle?.visibility).toBe("featured");
    expect(cliArticle?.content).toContain("mAI CLI");

    expect(
      existsSync(
        resolve(ROOT, "components/site/account/quota-resets-section.tsx")
      )
    ).toBe(false);
    expect(existsSync(resolve(ROOT, "app/(chat)/site/actions/resets.ts"))).toBe(
      false
    );
  });
});
