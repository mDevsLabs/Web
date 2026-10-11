import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  prochaineExecution,
  STATUT_TACHE,
  TACHE_BAIL_MS,
  TACHE_MAX_TENTATIVES,
  tentativesEpuisees,
} from "@/lib/wakies/task-lease";

/**
 * Cycle de vie des tâches planifiées Wakies : bail, tentatives, statuts.
 *
 * Régression : une invocation serverless tuée après la revendication laissait la
 * tâche `running` pour toujours — le tick ne la reprenait pas, ou la reprenait
 * sans borne. Trois défauts distincts, un seul test :
 *  1. le bail (180 s) expirait avant la fin d'une exécution autorisée jusqu'à
 *     300 s : la reprise était accidentellement garantie au lieu d'être rare ;
 *  2. la finalisation était un `SELECT` puis `UPDATE` sans verrou, donc deux
 *     workers pouvaient tous deux se croire propriétaires ;
 *  3. aucun compteur n'existait, donc une occurrence dont l'exécution meurt
 *     toujours rebondissait indéfiniment.
 *
 * La logique SQL réelle ne s'observe que sur une base (voir le test
 * d'intégration conditionnel). Ce qui est testable sans base est ce qui a causé
 * le bug : les constantes, le vocabulaire, et la forme des requêtes.
 */

const ROOT = resolve(import.meta.dirname, "..", "..");
const QUERIES = readFileSync(resolve(ROOT, "lib/wakies/queries.ts"), "utf8");

describe("Bail — durée et bornes", () => {
  it("est strictement plus long que l'exécution maximale autorisée", () => {
    // La borne est produit : 6 minutes pour un tick de 300 s. Elle n'est pas un
    // réglage libre, c'est ce qui rend la reprise rare plutôt que systématique.
    expect(TACHE_BAIL_MS).toBe(6 * 60_000);
  });

  it("n'est plus écrit en dur dans la revendication", () => {
    const claim = extraireFonction(QUERIES, "claimDueTask");
    expect(claim).toContain("TACHE_BAIL_MS");
    expect(claim).not.toMatch(/leaseUntil:\s*new Date\(Date\.now\(\) \+ 180/);
  });
});

describe("Tentatives — borne et remise à zéro", () => {
  it.each([
    [1, false],
    [2, false],
    [TACHE_MAX_TENTATIVES, false],
    [TACHE_MAX_TENTATIVES + 1, true],
    [TACHE_MAX_TENTATIVES + 9, true],
  ])("tentativesEpuisees(%i) rend %s", (attempt, attendu) => {
    expect(tentativesEpuisees(attempt)).toBe(attendu);
  });

  it("porte le compteur dans la base, pas dans le worker", () => {
    const claim = extraireFonction(QUERIES, "claimDueTask");
    expect(claim).toMatch(/attempt:\s*sql`\$\{wakiesTask\.attempt\} \+ 1`/);
  });

  it("le remet à zéro à la fin comme à la relance manuelle", () => {
    // Sinon, un « Exécuter » après trois échecs serait refusé aussitôt et le
    // compteur ne redescendrait jamais d'une tâche en service.
    expect(extraireFonction(QUERIES, "finishTask")).toContain("attempt: 0");
    expect(extraireFonction(QUERIES, "actionTask")).toContain("attempt: 0");
  });

  it("n'efface plus l'erreur au moment de revendiquer", () => {
    const claim = extraireFonction(QUERIES, "claimDueTask");
    expect(claim).not.toMatch(/^\s*error: null,/m);
  });
});

describe("Prochaine exécution — la règle est une seule", () => {
  const maintenant = new Date("2026-10-11T12:00:00.000Z");

  it("programme d'après l'intervalle persisté", () => {
    const suivante = prochaineExecution(3600, maintenant);
    expect(suivante?.toISOString()).toBe("2026-10-11T13:00:00.000Z");
  });

  it.each([[null], [0], [-60]])(
    "rend null pour un intervalle non récurrent (%s)",
    (intervalle) => {
      // `0` est le piège : en JS il est falsif, donc un simple `if (intervalle)`
      // aurait eu le bon résultat ici — mais une tâche à « 0 seconde » doit être
      // refusée explicitement, pas par la coercition.
      expect(prochaineExecution(intervalle, maintenant)).toBeNull();
    }
  );

  it("part de l'instant de fin, jamais de l'échéance d'origine", () => {
    const suivante = prochaineExecution(60, maintenant);
    expect(suivante).not.toBeNull();
    expect(suivante?.getTime()).toBe(maintenant.getTime() + 60_000);
  });

  it("est la seule source du calcul dans finishTask et scheduleTask", () => {
    for (const nom of ["finishTask", "scheduleTask"]) {
      const source = extraireFonction(QUERIES, nom);
      expect(source).toContain("prochaineExecution(");
      expect(source).not.toMatch(/intervalSeconds\s*\*\s*1000/);
    }
  });
});

describe("Statuts — vocabulaire fermé", () => {
  it("couvre exactement les six états écrits en base", () => {
    // `status` est un varchar(16) sans contrainte CHECK : le type fermé est la
    // seule borne, et un statut inventé sortirait la tâche du prédicat.
    expect(Object.values(STATUT_TACHE).sort()).toEqual([
      "cancelled",
      "completed",
      "failed",
      "paused",
      "queued",
      "running",
    ]);
  });

  it("est celui que l'interface connaît déjà", () => {
    const types = readFileSync(
      resolve(ROOT, "lib/wakies/shared/types.ts"),
      "utf8"
    );
    for (const statut of Object.values(STATUT_TACHE)) {
      expect(types).toContain(`"${statut}"`);
    }
  });

  it("garde le prédicat de revendication à trois branches", () => {
    const claim = extraireFonction(QUERIES, "claimDueTask");
    expect(claim).toContain("eq(wakiesTask.status, STATUT_TACHE.file)");
    expect(claim).toContain("eq(wakiesTask.status, STATUT_TACHE.complete)");
    expect(claim).toContain("eq(wakiesTask.status, STATUT_TACHE.enCours)");
    expect(claim).toContain("lt(wakiesTask.leaseUntil, maintenant)");
  });
});

describe("Fencing — la finalisation est un compare-and-set", () => {
  it("relit la tâche sous verrou, filtrée par bail ET porteur", () => {
    for (const nom of ["finishTask", "failTask"]) {
      const source = extraireFonction(QUERIES, nom);
      expect(source, `${nom} ne verrouille pas sa lecture`).toContain(
        '.for("update")'
      );
      expect(source).toContain("eq(wakiesTask.lease, lease)");
      expect(source).toContain("eq(wakiesTask.claimedBy, workerId)");
      expect(source).toContain("eq(wakiesTask.status, STATUT_TACHE.enCours)");
    }
  });

  it("ne ressuscite plus un run déjà interrompu", () => {
    // Sans condition de statut sur le run, l'ancien worker pouvait réécrire en
    // `completed` un run passé à `interrupted` par la reprise.
    for (const nom of ["finishTask", "failTask"]) {
      const source = extraireFonction(QUERIES, nom);
      expect(source).toContain(`eq(wakiesTaskRun.status, "running")`);
      expect(source).toContain("eq(wakiesTaskRun.taskId, taskId)");
    }
  });

  it("écrit l'événement d'échec dans la transaction, fence par le bail", () => {
    const fail = extraireFonction(QUERIES, "failTask");
    expect(fail).toContain("db.transaction(");
    expect(fail).not.toContain("addTaskEvent(");
    // `addTaskEvent` hors bail était la porte par laquelle un worker expiré
    // écrivait dans une tâche qu'il ne possédait plus.
    expect(fail).toContain("insert(wakiesTaskEvent)");
  });

  it("rend un booléen que l'appelant exploite", () => {
    expect(extraireFonction(QUERIES, "failTask")).toMatch(/Promise<boolean>/);
    expect(extraireFonction(QUERIES, "finishTask")).toMatch(/Promise<boolean>/);
  });
});

describe("Migration — les colonnes existent avant que le code les lise", () => {
  const SQL = readFileSync(
    resolve(ROOT, "lib/db/migrations/0052_wakies_task_fencing.sql"),
    "utf8"
  );

  it("ajoute attempt et claimedBy de façon idempotente", () => {
    expect(SQL).toMatch(/ADD COLUMN IF NOT EXISTS "attempt" integer/);
    expect(SQL).toMatch(/ADD COLUMN IF NOT EXISTS "claimedBy" varchar\(128\)/);
    expect(SQL).toMatch(
      /CREATE INDEX IF NOT EXISTS "WakiesTask_status_leaseUntil_idx"/
    );
  });

  it("est additive : aucun DROP, aucun changement de type", () => {
    // Règle AGENTS.md §6.1, vérifiée sur le SQL lui-même et non sur une
    // intention.
    expect(SQL).not.toMatch(/DROP\s+COLUMN/i);
    expect(SQL).not.toMatch(/ALTER\s+COLUMN/i);
  });

  it("n'introduit aucun DDL dans un chemin de requête", () => {
    // Le précédent est `apps/site/lib/api-key-manager.ts` : un ALTER au runtime,
    // muet sur un rôle sans privilège DDL.
    expect(QUERIES).not.toMatch(/ALTER\s+TABLE/i);
    expect(existsSync(resolve(ROOT, "lib/wakies/task-lease.ts"))).toBe(true);
  });
});

/**
 * Corps d'une fonction exportée, délimité par la prochaine fonction au même
 * niveau d'indentation. Assertion de forme sur du source, déjà la méthode des
 * tests « safety » du dépôt (`db-migration-safety.test.ts`).
 */
function extraireFonction(source: string, nom: string): string {
  const debut = source.indexOf(`export async function ${nom}(`);
  if (debut === -1) {
    throw new Error(`Fonction introuvable : ${nom}`);
  }
  const suite = source.slice(debut);
  const fin = suite.search(
    /\n(?:export async function|export function|async function|function)\s+\w+/
  );
  return fin === -1 ? suite : suite.slice(0, fin);
}
