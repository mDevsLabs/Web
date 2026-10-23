import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le verbe HTTP du planificateur contre les exportations de la route.
 *
 * Régression : le planificateur appelait `/api/cron/wakies` en `POST`, alors que
 * la route n'exportait que `GET`. Next répond 405, et le planificateur masquait
 * l'échec (`continue-on-error` sur l'étape du workflow, isolation par tick dans
 * le val) : le job restait vert, le tick ne s'exécutait jamais, et les tâches
 * récurrentes ne se déclenchaient plus depuis des centaines de runs sans un seul
 * signal. Le symptôme observable (« la répétition ne marche pas ») avait été
 * attribué à la persistance de l'intervalle, qui était de fait déjà correct.
 *
 * Le planificateur est passé de `.github/workflows/cron-tasks.yml` au val CRON
 * Val Town `cron.ts` : la moitié « accord entre le planificateur et les routes »
 * du test ne change pas, seul l'artefact lu change.
 *
 * Le test relie les deux artefacts, comme `botid-client-routes.test.ts` relie le
 * client d'instrumentation à ses routes : ni l'un ni l'autre n'est faux seul,
 * c'est leur accord qui porte la vérité — et rien dans le dépôt ne le vérifiait.
 */

const ROOT = resolve(import.meta.dirname, "..", "..");
const VAL = resolve(ROOT, "cron.ts");

type Appel = { endpoint: string; methode: "DELETE" | "GET" | "POST" | "PUT" };

/**
 * Chaque descripteur de tick du val : `{ budgetMs, method, path }`. Le verbe est
 * explicite partout, y compris pour Vibe — un GET déduit d'un `fetch` sans
 * `method` serait un faux négatif exactement comme le `curl` sans `-X` l'était.
 */
function appelsDuVal(): Appel[] {
  const source = readFileSync(VAL, "utf8");
  const appels: Appel[] = [];
  for (const bloc of source.matchAll(/\{[^{}]*\bpath:[^{}]*\}/g)) {
    const endpoint = /path:\s*"(\/api\/cron\/[a-z-]+)"/.exec(bloc[0])?.[1];
    const methode = /method:\s*"(GET|POST)"/.exec(bloc[0])?.[1];
    if (endpoint && methode) {
      appels.push({ endpoint, methode: methode as Appel["methode"] });
    }
  }
  return appels;
}

const APPELS = appelsDuVal();

describe("Cron — le val appelle bien des routes qui l'écoutent", () => {
  it("trouve au moins quatre appels de tick dans le val", () => {
    // Garde du test lui-même : un motif qui ne matche plus rien le ferait passer
    // à vide, ce qui est pire que son absence.
    expect(APPELS.length).toBeGreaterThanOrEqual(4);
    expect(new Set(APPELS.map((appel) => appel.endpoint))).toEqual(
      new Set([
        "/api/cron/agent",
        "/api/cron/notifications",
        "/api/cron/planning",
        "/api/cron/vibe",
        "/api/cron/wakies",
      ])
    );
  });

  it.each(APPELS.map((appel) => [appel.methode, appel.endpoint] as const))(
    "%s %s est exporté par la route",
    (methode, endpoint) => {
      const nom = endpoint.split("/").pop() ?? "";
      const fichier = resolve(ROOT, `app/api/cron/${nom}/route.ts`);
      expect(existsSync(fichier), `route absente : ${endpoint}`).toBe(true);
      const source = readFileSync(fichier, "utf8");
      expect(
        new RegExp(`export\\s+async\\s+function\\s+${methode}\\s*\\(`).test(
          source
        ),
        `${endpoint} n'exporte pas ${methode} — le val recevra 405`
      ).toBe(true);
    }
  );

  it("n'est doublement déclenché par aucun workflow résiduel", () => {
    // Deux ordonnanceurs ne cassent rien (chaque route réserve atomiquement son
    // occurrence), mais ils paient deux fois le même tick et rendent la lecture
    // des journaux impossible. Le val est l'unique planificateur.
    const dossiers = [".github/workflows"];
    const residuels: string[] = [];
    for (const dossier of dossiers) {
      for (const fichier of readdirSync(resolve(ROOT, dossier))) {
        if (!/\.ya?ml$/i.test(fichier)) {
          continue;
        }
        const chemin = resolve(ROOT, dossier, fichier);
        if (readFileSync(chemin, "utf8").includes("/api/cron/")) {
          residuels.push(`${dossier}/${fichier}`);
        }
      }
    }
    expect(residuels).toEqual([]);
  });

  it("expose les deux entrées attendues par un déclencheur CRON Val Town", () => {
    const source = readFileSync(VAL, "utf8");
    expect(source).toMatch(/export\s+async\s+function\s+cronValHandler\s*\(/);
    expect(source).toMatch(/export\s+default\s+async\s+function/);
  });
});

describe("Cron — l'identité du tick Wakies est celle du porteur du bail", () => {
  it("réclame la tâche avec le workerId de l'invocation en cours", () => {
    const source = readFileSync(
      resolve(ROOT, "app/api/cron/wakies/route.ts"),
      "utf8"
    );
    // Un workerId fabriqué à la réponse et jamais passé au claim ne fence rien :
    // c'est exactement ce qui laissait une invocation tuée bloquer la tâche.
    expect(source).toMatch(/const workerId = `cron-\$\{randomUUID\(\)/);
    expect(source).toMatch(/claimDueTask\(\s*userId,\s*workerId\s*\)/);
    expect(source).toMatch(/finishTask\([^)]*workerId/s);
    expect(source).toMatch(/failTask\([^)]*workerId/s);
  });

  it("ne laisse pas une finalisation refusée passer inaperçue", () => {
    const source = readFileSync(
      resolve(ROOT, "app/api/cron/wakies/route.ts"),
      "utf8"
    );
    expect(source).toContain("perdus");
    expect(source).toMatch(/const finalise = await finishTask/);
  });
});

describe("Cron — le bail survit à la durée maximale de l'invocation", () => {
  it("est plus long que maxDuration de la route", async () => {
    const { TACHE_BAIL_MS } = await import("@/lib/wakies/task-lease");
    const source = readFileSync(
      resolve(ROOT, "app/api/cron/wakies/route.ts"),
      "utf8"
    );
    const maxDuration = Number(
      /export const maxDuration = (\d+)/.exec(source)?.[1]
    );
    expect(Number.isFinite(maxDuration)).toBe(true);
    // Un bail plus court que l'exécution autorise la reprise PENDANT qu'elle
    // tourne : deux appels de modèle pour une même occurrence.
    expect(TACHE_BAIL_MS).toBeGreaterThan(maxDuration * 1000);
  });
});
