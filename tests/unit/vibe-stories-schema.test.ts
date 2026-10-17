import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Concordance du schéma de stories.
 *
 * Le DDL Vibe vit à DEUX endroits : `ensureStoriesTables()` dans le module
 * backend (qui crée les tables au chargement) et la migration numérotée appliquée
 * par `apps/vibe/lib/db/migrator.ts` (qui équipe la base de l'app mobile). Les
 * deux doivent décrire la même structure — une divergence ne se voit qu'au
 * premier environnement où l'un des deux seulement a tourné.
 */

const RACINE = path.resolve(import.meta.dirname, "..", "..");

function source(chemin: string): string {
  return readFileSync(path.join(RACINE, chemin), "utf8");
}

const migration = source("apps/vibe/lib/db/migrations/026_vibe_stories.sql");
const stories = source("vibe-stories.ts");

const TABLES = [
  "vibe_stories",
  "vibe_story_media",
  "vibe_story_views",
  "vibe_story_reactions",
  "vibe_story_usage_daily",
];

describe("Schéma des stories", () => {
  it.each(TABLES)("crée %s dans la migration et dans le runtime", (table) => {
    expect(migration).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    expect(stories).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
  });

  it("est additif et idempotent", () => {
    // Règle des migrations de ce dépôt : jamais de DROP, et un rejeu ne doit
    // rien casser (le migrateur Vibe rejoue sur chaque environnement).
    expect(migration).not.toMatch(/DROP\s+(TABLE|COLUMN|INDEX)/i);
    const creations = migration.match(/CREATE TABLE IF NOT EXISTS/g) || [];
    expect(creations.length).toBe(TABLES.length);
    expect(
      migration.match(/CREATE INDEX IF NOT EXISTS/g)?.length
    ).toBeGreaterThan(0);
  });

  it("dédoublonne les vues par une clé composée", () => {
    // Sans elle, revoir une story gonflerait le compteur de l'auteur à chaque
    // ouverture. La PRIMARY KEY (story_id, viewer_id) rend la vue idempotente.
    const vues = migration.slice(
      migration.indexOf("CREATE TABLE IF NOT EXISTS vibe_story_views"),
      migration.indexOf("CREATE TABLE IF NOT EXISTS vibe_story_reactions")
    );
    expect(vues).toContain("PRIMARY KEY (story_id, viewer_id)");
    expect(stories).toContain("ON CONFLICT (story_id, viewer_id) DO NOTHING");
  });

  it("plafonne une réaction par emoji, spectateur et story", () => {
    expect(migration).toContain("UNIQUE (story_id, user_id, emoji)");
    expect(stories).toContain(
      "ON CONFLICT (story_id, user_id, emoji) DO NOTHING"
    );
  });

  it("donne une clé naturelle au compteur journalier", () => {
    const usage = migration.slice(
      migration.indexOf("CREATE TABLE IF NOT EXISTS vibe_story_usage_daily")
    );
    expect(usage).toContain("PRIMARY KEY (user_id, usage_date)");
    expect(usage).toContain("stories_created INTEGER NOT NULL DEFAULT 0");
    expect(stories).toContain("ON CONFLICT (user_id, usage_date)");
  });

  it("stocke une expiration calculée, sans cron", () => {
    // L'archivage est un prédicat de lecture (`expires_at <= NOW()`) : aucun job
    // n'est nécessaire pour faire disparaître une story du rail.
    expect(migration).toContain("expires_at TIMESTAMPTZ NOT NULL");
    expect(migration).toContain("deleted_at TIMESTAMPTZ");
    expect(migration).toContain("archived_at TIMESTAMPTZ");
    expect(stories).toMatch(/make_interval\(hours => \$\{STORY_TTL_HOURS\}\)/);
    expect(stories).toContain("s.expires_at > NOW()");
  });

  it("n'ancre aucun index partiel sur une fonction non immuable", () => {
    // `WHERE expires_at > NOW()` est refusé par PostgreSQL pour un index partiel
    // (prédicat doit être constant). Le filtre d'expiration vit dans la requête.
    const partiels = migration.match(/CREATE INDEX[^;]*WHERE[^;]*;/g) || [];
    for (const index of partiels) {
      expect(index).not.toMatch(/NOW\(\)/);
    }
    expect(partiels.length).toBeGreaterThan(0);
  });

  it("aligne les types de clés étrangères sur ceux de Vibe", () => {
    // `users.id` est un INTEGER côté Vibe : une BIGINT ici casserait les jointures
    // sur les environnements où la colonne hôte est un entier 32 bits.
    const blocs = TABLES.map((t) => migration.slice(migration.indexOf(t)));
    for (const bloc of blocs) {
      expect(bloc).not.toMatch(/user_id BIGINT|viewer_id BIGINT/);
    }
    expect(migration).toMatch(
      /user_id INTEGER NOT NULL REFERENCES users\(id\)/
    );
  });

  it("contraint visibilité et type de média par CHECK", () => {
    expect(migration).toContain("vibe_stories_visibility_check");
    expect(migration).toContain("vibe_story_media_type_check");
    // Les mêmes valeurs côté module, pour que le runtime et le client Vibe
    // (StoryComposer) ne puissent pas proposer une option que la base refuse.
    expect(stories).toContain(
      'STORY_VISIBILITIES = ["followers", "public", "private"]'
    );
    expect(stories).toContain("STORY_TTL_HOURS = 24");
  });

  it("cascade la suppression de l'auteur et de la story", () => {
    expect(
      migration.match(/ON DELETE CASCADE/g)!.length
    ).toBeGreaterThanOrEqual(6);
  });
});
