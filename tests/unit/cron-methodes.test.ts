import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le verbe HTTP du planificateur GitHub contre les exportations de la route.
 *
 * Régression : `.github/workflows/cron-tasks.yml` appelle `/api/cron/wakies` en
 * `POST`, alors que la route n'exportait que `GET`. Next répond 405, et
 * `continue-on-error: true` masque l'échec : le job reste vert, le tick ne
 * s'exécute jamais, et les tâches récurrentes ne se déclenchent plus depuis des
 * centaines de runs sans un seul signal. Le symptôme observable (« la répétition
 * ne marche pas ») avait été attribué à la persistance de l'intervalle, qui
 * était de fait déjà correct.
 *
 * Le test relie les deux artefacts, comme `botid-client-routes.test.ts` relie le
 * client d'instrumentation à ses routes : ni l'un ni l'autre n'est faux seul,
 * c'est leur accord qui porte la vérité — et rien dans le dépôt ne le vérifiait.
 */

const ROOT = resolve(import.meta.dirname, "..", "..");
const WORKFLOW = resolve(ROOT, ".github/workflows/cron-tasks.yml");

type Appel = { endpoint: string; methode: "DELETE" | "GET" | "POST" | "PUT" };

/**
 * Chaque `curl` du workflow qui vise `/api/cron/<nom>`. `curl` sans `-X` est un
 * GET : c'est le cas de l'étape Vibe, et le deviner ici serait un faux négatif.
 */
function appelsDuWorkflow(): Appel[] {
  const lignes = readFileSync(WORKFLOW, "utf8").split(/\r?\n/);
  const appels: Appel[] = [];
  for (const ligne of lignes) {
    if (!ligne.includes("curl")) {
      continue;
    }
    const cible = ligne.match(/\$?\{?CLEAN_URL\}?(\/api\/cron\/[a-z-]+)/);
    if (!cible?.[1]) {
      continue;
    }
    const verbe = ligne.match(/-X\s+(GET|POST|PUT|DELETE|PATCH)/i);
    const methode = (verbe?.[1] ?? "GET").toUpperCase() as Appel["methode"];
    appels.push({ endpoint: cible[1], methode });
  }
  return appels;
}

const APPELS = appelsDuWorkflow();

describe("Cron — le workflow appelle bien des routes qui l'écoutent", () => {
  it("trouve au moins quatre appels de tick dans le workflow", () => {
    // Garde du test lui-même : un motif qui ne matche plus rien le ferait passer
    // à vide, ce qui est pire que son absence.
    expect(APPELS.length).toBeGreaterThanOrEqual(4);
    expect(new Set(APPELS.map((appel) => appel.endpoint))).toEqual(
      new Set([
        "/api/cron/agent",
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
        `${endpoint} n'exporte pas ${methode} — le workflow recevra 405`
      ).toBe(true);
    }
  );
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
