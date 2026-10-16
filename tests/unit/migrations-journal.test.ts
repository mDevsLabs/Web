import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Intégrité du journal des migrations.
 *
 * AGENTS.md §6.1 pose une règle dont la violation est silencieuse : le runner
 * itère le **tableau** `entries` et compare chaque `when` au watermark numérique.
 * Une entrée insérée avec un `when` périmé est **ignorée sans erreur** ; un `.sql`
 * absent du journal n'est **jamais appliqué** ; un `.sql` journalisé sans fichier
 * fait planter le job. Trois façons de rater une migration sans aucun signal, et
 * rien dans le dépôt ne les contrôlait — `migrations-sql-integrity.test.ts` ne
 * regarde que le contenu du SQL.
 *
 * C'est le garde-fou qui manque au lot de migration 0052 : si `attempt` et
 * `claimedBy` n'arrivent jamais en base, `claimDueTask` échoue en `42703` et plus
 * aucune tâche récurrente ne démarre — soit exactement le symptôme qu'on croyait
 * corrigé par le code du tick.
 */

const ROOT = resolve(import.meta.dirname, "..", "..");
const DOSSIER = resolve(ROOT, "lib/db/migrations");

type Entree = {
  breakpoints?: boolean;
  idx: number;
  tag: string;
  version: string;
  when: number;
};

const journal = JSON.parse(
  readFileSync(resolve(DOSSIER, "meta/_journal.json"), "utf8")
) as { entries: Entree[] };

const ENTRIES = journal.entries;

const FICHIERS_SQL = readdirSync(DOSSIER)
  .filter((nom) => nom.endsWith(".sql"))
  .sort();

/**
 * Fichiers `.sql` présents mais hors journal, assumés comme tels.
 *
 * Les deux sont **périmés**, et les journaliser serait une régression :
 *
 *  - `0014_notifications_and_memory.sql` : sa contrainte CHECK énumère sept types
 *    de notification. `lib/db/migrate.ts:417-422` pose la même contrainte avec
 *    douze types, en étape de réparation exécutée AVANT les migrations Drizzle.
 *    Rendre 0014 au journal la ferait passer après, donc la **rétrécir** — et les
 *    notifications d'Agent (`agent_run_finished`, `agent_approval_required`…)
 *    seraient refusées en base.
 *
 * `01_skills_mcp_marketplace.sql` figurait ici et a été supprimé : ses quatre
 * tables (`SkillTemplate`, `McpTemplate` par `0006` ; `SkillVersion`, `SkillUsage`
 * par `0012`) sont créées par des migrations journalisées. Le fichier était un
 * doublon mort dont la présence seule faisait croire à une migration en attente.
 *
 * La liste vaut aveu de dette, pas tolérance : elle est là pour que quelqu'un qui
 * lirait « .sql sans entrée de journal = no-op silencieux » (AGENTS.md §6.1) et
 * voudrait « réparer » tombe sur ce commentaire avant d'écrire l'entrée.
 */
const ORPHINS_CONNUS = ["0014_notifications_and_memory.sql"];

/**
 * Migrations antérieures à la règle « additive only » (AGENTS.md §6.1), qui
 * contiennent un `DROP COLUMN` ou un `DROP TABLE`. Le dépôt ne peut pas les
 * réécrire — une migration déjà appliquée n'est jamais rejouée, et le SQL est
 * historique. La règle n'est donc contrôlée que sur ce qui est ajouté : ces trois
 * noms sont la photo de l'existant au jour où ce garde-fou arrive.
 */
const DESTRUCTIFS_HERITES = [
  "0007_agents.sql",
  "0029_agent_templates_icons_and_tool_modes.sql",
  "0031_memory_schema_cleanup.sql",
];

describe("Journal des migrations — concordance avec le disque", () => {
  it("est non vide et numéroté contiguïtement depuis zéro", () => {
    expect(ENTRIES.length).toBeGreaterThan(40);
    ENTRIES.forEach((entree, position) => {
      expect(entree.idx, `idx discontinu à la position ${position}`).toBe(
        position
      );
    });
  });

  it("a des `when` strictement croissants", () => {
    // Le watermark est numérique : une entrée au `when` périmée est sautée en
    // silence. Une égalité compte déjà comme une anomalie, pas seulement un recul.
    for (let index = 1; index < ENTRIES.length; index++) {
      const precedente = ENTRIES[index - 1]?.when ?? 0;
      const courante = ENTRIES[index]?.when ?? 0;
      expect(
        courante > precedente,
        `entrée ${ENTRIES[index]?.tag} a un when (${courante}) non croissant après ${precedente} — elle serait ignorée`
      ).toBe(true);
    }
  });

  it.each(ENTRIES.map((e) => [e.tag] as const))(
    "%s a son fichier .sql",
    (tag) => {
      expect(
        existsSync(resolve(DOSSIER, `${tag}.sql`)),
        "entrée journalisée sans SQL : le job échoue"
      ).toBe(true);
    }
  );

  it("ne laisse aucun .sql hors journal, sauf la liste assumée", () => {
    const journalises = new Set(ENTRIES.map((entree) => entree.tag));
    const orphelins = FICHIERS_SQL.filter(
      (nom) =>
        !ORPHINS_CONNUS.includes(nom) &&
        !journalises.has(nom.replace(/\.sql$/, ""))
    );
    expect(orphelins).toEqual([]);
  });

  it("garde 0053, 0054, 0055 et 0056 dans l'ordre d'ajout du journal", () => {
    const cinquanteSix = ENTRIES.find(
      (entree) => entree.tag === "0056_user_preferences_theme"
    );
    const cinquanteCinq = ENTRIES.find(
      (entree) => entree.tag === "0055_wakies_page_pinning_and_settings"
    );
    const cinquanteQuatre = ENTRIES.find(
      (entree) => entree.tag === "0054_user_forms_and_rewards"
    );
    const cinquanteTrois = ENTRIES.find(
      (entree) => entree.tag === "0053_wakies_space_pinning_and_context"
    );
    const cinquanteDeux = ENTRIES.find(
      (entree) => entree.tag === "0052_wakies_task_fencing"
    );
    expect(cinquanteTrois).toBeDefined();
    expect(cinquanteDeux).toBeDefined();
    expect(cinquanteQuatre).toBeDefined();
    expect(cinquanteCinq).toBeDefined();
    expect(cinquanteSix).toBeDefined();
    expect((cinquanteTrois?.idx ?? 0) > (cinquanteDeux?.idx ?? 0)).toBe(true);
    expect((cinquanteQuatre?.idx ?? 0) > (cinquanteTrois?.idx ?? 0)).toBe(true);
    expect((cinquanteCinq?.idx ?? 0) > (cinquanteQuatre?.idx ?? 0)).toBe(true);
    expect(cinquanteSix?.idx).toBe(ENTRIES.length - 1);
    expect((cinquanteTrois?.when ?? 0) > (cinquanteDeux?.when ?? 0)).toBe(true);
    expect((cinquanteQuatre?.when ?? 0) > (cinquanteTrois?.when ?? 0)).toBe(
      true
    );
    expect((cinquanteCinq?.when ?? 0) > (cinquanteQuatre?.when ?? 0)).toBe(
      true
    );
    expect((cinquanteSix?.when ?? 0) > (cinquanteCinq?.when ?? 0)).toBe(true);
  });

  it("n'ajoute aucun .sql destructif, la règle étant l'additif only", () => {
    const fautives: string[] = [];
    for (const nom of FICHIERS_SQL) {
      if (ORPHINS_CONNUS.includes(nom) || DESTRUCTIFS_HERITES.includes(nom)) {
        continue;
      }
      const sql = readFileSync(resolve(DOSSIER, nom), "utf8");
      // Commentaires retirés : « pas de DROP » est une règle sur le SQL exécuté,
      // pas sur le texte qui l'explique.
      const code = sql.replace(/--[^\n]*/g, "");
      if (/\bDROP\s+COLUMN\b/i.test(code) || /\bDROP\s+TABLE\b/i.test(code)) {
        fautives.push(nom);
      }
    }
    expect(fautives).toEqual([]);
  });
});
