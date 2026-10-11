import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Verrous du quota de stories.
 *
 * Le module backend est hors du typecheck Next (imports `npm:` Deno), donc il ne
 * peut pas être importé ici : le contrat est vérifié sur le source, comme
 * `agents-quota-models.test.ts` le fait déjà pour `config.ts`.
 */

const RACINE = path.resolve(import.meta.dirname, "..", "..");

function source(chemin: string): string {
  return readFileSync(path.join(RACINE, chemin), "utf8");
}

const config = source("config.ts");
const stories = source("vibe-stories.ts");

describe("Quota journalier des stories", () => {
  it("accorde 1 story au Free, 5 à Plus, 10 à Pro, et nil à Max", () => {
    const table = config.slice(
      config.indexOf("TIER_DAILY_STORY_LIMITS"),
      config.indexOf("getTierDailyStoryLimit")
    );
    expect(table).toContain("Free: 1");
    expect(table).toContain("Plus: 5");
    expect(table).toContain("Pro: 10");
    // `null` et non un grand nombre : Max n'a aucune vérification à effectuer.
    expect(table).toContain("Max: null");
    expect(config).toMatch(
      /TIER_DAILY_STORY_LIMITS: Record<Tier, number \| null>/
    );
  });

  it("ne code aucun plafond en dur dans le module", () => {
    // Le getter du backend est la seule source du nombre. Un `if (used >= 1)`
    // réapparaîtrait invisible pour les forfaits payants.
    expect(stories).toContain("getTierDailyStoryLimit(tier)");
    expect(stories).not.toMatch(/used\s*>=\s*\d/);
    expect(stories).not.toMatch(/limit\s*===?\s*\d/);
  });

  it("tombe sur la limite la plus stricte si le forfait est illisible", () => {
    // normalizeTier retourn "Free" pour une valeur inconnue : un JWT muet ne peut
    // pas ouvrir 5 publications à un compte Free.
    expect(config).toMatch(/TIER_DAILY_STORY_LIMITS\[normalizeTier\(tier\)\]/);
  });

  it("utilise un compteur dédié et non celui des images", () => {
    // Melanger les deux corromprait les deux quotas : une story n'est pas une
    // image generee par l'IA.
    expect(stories).toContain("vibe_story_usage_daily");
    expect(stories).not.toContain("daily_image_usage");
  });

  it("borne le jour en heure de Paris, jamais par CURRENT_DATE", () => {
    // CURRENT_DATE est UTC côté Postgres : le quota se renouvelerait à 1 h ou 2 h
    // du matin pour un francophone. La clé de jour est donc calculée dans le
    // module et passée explicitement à l'upsert.
    expect(stories).toContain("timeZone: STORY_TIME_ZONE");
    expect(stories).toContain('STORY_TIME_ZONE = "Europe/Paris"');
    expect(stories).toMatch(/\$\{dayKey\}::date/);
    expect(stories).not.toMatch(/usage_date\s*=\s*CURRENT_DATE/);
  });

  it("annonce une réinitialisation à minuit heure de Paris", () => {
    expect(stories).toContain("Réinitialisation à minuit, heure de Paris.");
    expect(stories).toContain("resetsInMs");
  });

  it("rend le 429 dans la forme que le client Vibe sait lire", () => {
    // `ApiService.executeRequest` fabrique `new Error(errJson.error)` : si
    // `error` est un objet, l'interface affiche « [object Object] ». Le message
    // doit donc être une chaîne, et le code machine rester accessible.
    const reponse = stories.slice(
      stories.indexOf("daily_story_quota_exceeded") - 400,
      stories.indexOf("daily_story_quota_exceeded") + 600
    );
    expect(reponse).toMatch(/error:\s*`/);
    expect(reponse).toContain('code: "daily_story_quota_exceeded"');
    expect(stories).not.toMatch(/error:\s*\{\s*code:/);
  });
});
