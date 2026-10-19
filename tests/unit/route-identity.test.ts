import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// L'identité persistante d'un compte n'est pas toujours une colonne `id` :
// `lib/auth/session.ts` lit `maiUser.id || maiUser.email`, précisément parce
// que le cas « l'identifiant EST l'adresse » existe (comptes créés côté
// plateforme, miroir local absent).
//
// Une route qui dérive l'identité avec `user.id` seul refuse donc la session de
// ces comptes alors que toutes les autres routes la servent. C'est arrivé sur
// les 6 gestionnaires de `/api/planning/**` et sur `/api/user/preferences` :
// la planification était invisible et les préférences retombaient à leurs
// valeurs par défaut, sans le moindre message d'erreur.
// `requireUser` (`lib/auth/require-user.ts`) est le SEUL endroit autorisé à
// dériver l'identité. Ce test lit les sources : il ne dépend d'aucun runtime
// de base et ne peut pas être contourné par un changement de comportement.
const API_ROOT = path.resolve(import.meta.dirname, "..", "..", "app");

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      return routeFiles(full);
    }
    return entry.endsWith(".ts") ? [full] : [];
  });
}

describe("Dérivation de l'identité canonique", () => {
  const offenders: string[] = [];

  for (const file of routeFiles(API_ROOT)) {
    const source = readFileSync(file, "utf8");
    const relative = path.relative(path.resolve(API_ROOT, "..", ".."), file);

    // `user.id || user.email` et `user.id ?? user.email` font ce qu'il faut,
    // mais en réécrivant la formule : c'est la dérive qu'on veut empêcher.
    // Seule forme tolérée hors `lib/auth/` : l'accès à la propriété brute.
    const bareId = source.match(
      /^\s*(?:const\s+)?\w+\s*=\s*user\.id\s*;?\s*$/m
    );
    const inlineBareId = source.match(/userId:\s*user\.id\s*[,}]/);
    const bareNullishId = source.match(/userId:\s*user\.id\s*\?\?/);

    if (bareId || inlineBareId || bareNullishId) {
      offenders.push(relative);
    }
  }

  it("ne dérive jamais l'identité avec `user.id` seul dans les routes", () => {
    // `lib/auth/require-user.ts` est le point de dérivation canonique ; les
    // routes doivent passer par lui.
    expect(offenders).toEqual([]);
  });

  it("continue d'exposer la formule `id || email` dans le session", () => {
    const session = readFileSync(
      path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "lib",
        "auth",
        "require-user.ts"
      ),
      "utf8"
    );
    expect(session).toContain("user.id || user.email");
  });
});
