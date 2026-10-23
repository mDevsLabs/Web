import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * La cible des ticks est vérifiée AVANT qu'ils ne partent.
 *
 * RÉGRESSION
 *
 * Le val annonçait `POST /api/cron/planning → HTTP 404`, corps « 404 Not
 * Found ». Ce corps est exactement celui que renvoie le BACKEND Val Town sur
 * toutes ses routes : `APP_URL` y pointait, et les cinq ticks échouaient en
 * silence, sans jamais nommer la cause. Un 404 sur une route cron ne dit pas
 * « la route a échoué » : il dit « cette route n'existe pas ici ».
 *
 * Le val refuse donc de partir vers un hôte de backend, et interroge une
 * route qui existe dans tous les déploiements — `/api/app-version` — pour
 * nommer la cible avant de lancer cinq minutes de ticks.
 *
 * NOTE : le source est lu BRUT, sans retrait des commentaires. L'expression
 * de cron commence par `*`/5 — une séquence `*`+`/` que le retrait naïf d'un
 * commentaire en bloc prend pour la fin du commentaire : le fichier serait
 * amputé de sa moitié.
 */

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const VAL = path.join(ROOT, "cron.ts");

function source(): string {
  return readFileSync(VAL, "utf8");
}

describe("Cron — la cible est vérifiée avant les ticks", () => {
  it("interroge une route présente dans tous les déploiements", () => {
    expect(source()).toContain('const PRECONTROLE_PATH = "/api/app-version"');
  });

  it("le précontrôle précède les ticks", () => {
    const code = source();
    const pref = code.indexOf("await verifierCible(config)");
    const ticks = code.indexOf("TICKS.map((tick) => callTick(config, tick))");
    expect(pref).toBeGreaterThan(-1);
    expect(ticks).toBeGreaterThan(pref);
  });

  it("refuse une URL qui pointe vers le backend Val Town", () => {
    // Le backend répond « 404 Not Found » sur TOUTES ses routes : les ticks
    // y sont muets, et le journal ne dit pas pourquoi.
    const code = source();
    expect(code).toContain("estHoteBackend");
    expect(code).toContain("val\\.run");
    expect(code).toContain("backend Val Town");
  });

  it("nomme la cause d'un 404 au lieu d'afficher un code nu", () => {
    expect(source()).toContain("la route n'existe pas sur");
  });
});

describe("Cron — le rejeu local compile en CommonJS", () => {
  it("n'emploie pas d'attente de premier niveau", () => {
    // Le dépôt est un paquet CommonJS : une attente de premier niveau ne
    // compile pas, et la commande documentée (`pnpm exec tsx cron.ts`)
    // refusait de démarrer. L'exécution locale est encapsulée.
    const code = source();
    expect(code).toContain("void (async () => {");
    const debut = code.indexOf("void (async () => {");
    const importDynamique = code.indexOf('await import("./cli-env.ts")');
    expect(importDynamique).toBeGreaterThan(debut);
  });
});
