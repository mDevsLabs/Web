import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le registre `lib/cron/ticks.ts` relie les ticks paresseux et la route
 * quotidienne Vercel aux handlers `app/api/cron/<tick>/route.ts`. Le test lit
 * les sources (le module est `server-only`) : un tick déclaré avec le mauvais
 * verbe, ou sans route, serait un tick qui ne s'exécute jamais.
 */

const ROOT = resolve(import.meta.dirname, "..", "..");
const lire = (chemin: string) => readFileSync(resolve(ROOT, chemin), "utf8");

type Tick = { methode: "GET" | "POST"; nom: string };

function ticksDuRegistre(): Tick[] {
  const source = lire("lib/cron/ticks.ts");
  const ticks: Tick[] = [];
  for (const bloc of source.matchAll(/\{[^{}]*\bname:\s*"[a-z-]+"[^{}]*\}/g)) {
    const nom = /name:\s*"([a-z-]+)"/.exec(bloc[0])?.[1];
    const methode = /method:\s*"(GET|POST)"/.exec(bloc[0])?.[1];
    if (nom && methode) {
      ticks.push({ methode: methode as Tick["methode"], nom });
    }
  }
  return ticks;
}

const TICKS = ticksDuRegistre();

describe("Cron — registre des ticks hôte", () => {
  it("déclare les six ticks attendus", () => {
    expect(TICKS.map((tick) => tick.nom).sort()).toEqual([
      "agent",
      "notifications",
      "planning",
      "quizzly",
      "vibe",
      "wakies",
    ]);
  });

  it.each(TICKS.map((tick) => [tick.methode, tick.nom] as const))(
    "%s %s : la route existe et exporte ce verbe",
    (methode, nom) => {
      const fichier = `app/api/cron/${nom}/route.ts`;
      expect(existsSync(resolve(ROOT, fichier)), `route absente : ${nom}`).toBe(
        true
      );
      expect(lire(fichier)).toMatch(
        new RegExp(`export\\s+async\\s+function\\s+${methode}\\s*\\(`)
      );
      // Le chargeur du registre importe bien ce verbe, pas l'autre.
      expect(lire("lib/cron/ticks.ts")).toMatch(
        new RegExp(
          `import\\("@/app/api/cron/${nom}/route"\\)\\)\\.${methode}\\b`
        )
      );
    }
  );

  it("fournit la route quotidienne Vercel, authentifiée et planifiée", () => {
    const route = lire("app/api/cron/daily/route.ts");
    expect(route).toMatch(/export\s+async\s+function\s+GET\s*\(/);
    expect(route).toContain("verifyCronAuth");

    const config = JSON.parse(lire("vercel.json")) as {
      crons?: Array<{ path: string; schedule: string }>;
    };
    const cron = config.crons?.find((c) => c.path === "/api/cron/daily");
    expect(cron, "cron Vercel /api/cron/daily absent").toBeDefined();
    // Plan Hobby : au plus un passage par jour (5 champs, pas de pas fréquent).
    expect(cron?.schedule).toMatch(/^\d+ \d+ \* \* \*$/);
  });
});

describe("Cron — table cron_ticks", () => {
  it("a une migration additive enregistrée dans le journal", () => {
    const sql = lire("lib/db/migrations/0089_cron_ticks.sql");
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS\s+"?cron_ticks"?/i);
    expect(sql).not.toMatch(/\bDROP\b/i);

    const journal = JSON.parse(
      lire("lib/db/migrations/meta/_journal.json")
    ) as {
      entries: Array<{ tag: string }>;
    };
    expect(journal.entries.some((e) => e.tag === "0089_cron_ticks")).toBe(true);
  });

  it("est déclarée dans le schéma Drizzle", () => {
    expect(lire("lib/db/schema.ts")).toMatch(/pgTable\(\s*"cron_ticks"/);
  });
});
