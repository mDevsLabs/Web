import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Copies, ordre d'enregistrement et garde de propriété.
 *
 * Le backend est déployé depuis la racine du dépôt ; `scripts/` porte la copie de
 * travail. La règle (docs/2-vibe/AGENTS.md §4) est l'identité byte à byte : une
 * divergence est silencieuse au déploiement, puisqu'un seul des deux fichiers part
 * sur Val Town. C'est le point dur de ce dépôt, d'où un test dédié.
 */

const RACINE = path.resolve(import.meta.dirname, "..", "..");

function source(chemin: string): string {
  return readFileSync(path.join(RACINE, chemin), "utf8");
}

describe("Copies backend du module stories", () => {
  it.each(["vibe-stories.ts", "config.ts", "storage.ts", "vibe.ts"])(
    "%s est identique à sa copie scripts/",
    (fichier) => {
      expect(
        source(fichier),
        `${fichier} a divergé de scripts/${fichier}`
      ).toBe(source(`scripts/${fichier}`));
    }
  );
});

describe("Enregistrement des routes de stories", () => {
  const stories = source("vibe-stories.ts");
  const vibe = source("vibe.ts");

  it("monte le module dans l'orchestrateur Vibe", () => {
    expect(vibe).toContain(
      'import { registerVibeStoriesRoutes } from "./vibe-stories.ts"'
    );
    expect(vibe).toContain("registerVibeStoriesRoutes(app, registerMulti)");
  });

  it("enregistre les chemins statiques avant /stories/:id", () => {
    // Hono résout à l'ordre d'enregistrement : si « tray » était déclaré après
    // `:id`, le mot « tray » serait absorbé comme un identifiant de story et le
    // rail renverrait une erreur 404/400 sur tous les clients.
    const positionTray = stories.indexOf('"/v1/stories/tray"');
    const positionArchive = stories.indexOf('"/v1/stories/archive"');
    const positionActive = stories.indexOf('"/v1/stories/active"');
    const positionParam = stories.indexOf('"/v1/stories/:id"');

    expect(positionTray).toBeGreaterThan(-1);
    expect(positionTray).toBeLessThan(positionParam);
    expect(positionArchive).toBeLessThan(positionParam);
    expect(positionActive).toBeLessThan(positionParam);
  });

  it("expose chaque route sous les trois alias maison", () => {
    // /v1/… (celui du client), /vibe/… et /api/vibe/… : le repli d'alias
    // d'ApiService ne couvre que 404/405, compter sur lui rendrait le rail
    // dépendant d'un détour.
    for (const chemin of ["tray", "active", "archive", "quota"]) {
      expect(stories).toContain(`"/api/vibe/stories/${chemin}"`);
      expect(stories).toContain(`"/vibe/stories/${chemin}"`);
      expect(stories).toContain(`"/v1/stories/${chemin}"`);
    }
  });

  it("réserve la liste des vues à l'auteur", () => {
    const views = stories.slice(
      stories.indexOf("const handleStoryViews"),
      stories.indexOf('"get",\n    [\n      "/api/vibe/stories/:id/views"')
    );
    // La vérification de propriété précède la lecture : un non-auteur ne doit pas
    // pouvoir faire compter les spectateurs d'une story qui ne lui appartient pas.
    expect(views.indexOf("Accès refusé")).toBeLessThan(
      views.indexOf("vibe_story_views v")
    );
    expect(views).toContain('return c.json({ error: "Accès refusé." }, 403)');
  });

  it("ne prend jamais l'identité dans le corps de la requête", () => {
    // Le porteur Bearer fait foi. Un `user_id` lu dans le corps permettrait de
    // publier, réagir ou compter des vues au nom d'un autre compte.
    expect(stories).not.toMatch(/body\?\.user_id/);
    expect(stories).not.toMatch(/body\?\.viewer_id/);
    expect(stories).toContain("await storyUserId(c)");
  });
});
