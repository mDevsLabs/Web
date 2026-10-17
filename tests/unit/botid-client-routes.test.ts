import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Régression : le mode Agent renvoyait « Vous n'avez pas l'autorisation
// d'accérer à cette ressource » dès l'envoi du message. Cause : la route
// serveur /api/agent appelle checkBotId() (via authenticateChatRequest) alors
// que la protection BotID côté client (instrumentation-client.ts) ne couvrait
// que /api/chat. Sans attestation client, Vercel classe la requête d'un
// utilisateur légitime comme un bot en production → access_denied.
// Le même défaut est reproduit par /api/wakies/chat : les 44 autres routes
// /api/wakies/** utilisent requireWakiesUser(), qui n'appelle jamais
// checkBotId(), et fonctionnaient — d'où un chat cassé et le reste intact.
//
// Ce test lie les deux listes. La liste serveur n'est PLUS écrite à la main :
// elle est dérivée des fichiers route.ts eux-mêmes. Une liste figée est
// précisément ce qui a laissé les deux régressions passer — le test était
// vert en production cassée.

/** Routes protégées déclarées côté client (instrumentation-client.ts). */
function readClientProtectedRoutes(): string[] {
  const source = readFileSync("instrumentation-client.ts", "utf8");
  const routePattern = /path:\s*[`"']([^`"']+)[`"']/g;
  const routes: string[] = [];
  for (const match of source.matchAll(routePattern)) {
    routes.push(match[1]);
  }
  if (routes.length === 0) {
    throw new Error(
      "instrumentation-client.ts ne déclare aucune route protégée — la protection BotID côté client est-elle encore en place ?"
    );
  }
  return routes;
}

/** Tous les fichiers route.ts du dossier app/, récursivement. */
function readRouteFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...readRouteFiles(full));
    } else if (entry.name === "route.ts") {
      found.push(full);
    }
  }
  return found;
}

/**
 * Chemin public d'un route.ts. Les groupes entre parenthèses — `(chat)`,
 * `(wakies)` — n'ont aucune valeur dans l'URL et doivent disparaître ; les
 * segments dynamiques sont conservés tels quels pour rester comparables.
 * On raisonne toujours en `/` : readdirSync rend des chemins natifs.
 */
function toPublicPath(file: string): string {
  const [, dir = ""] = /^app[\\/](.*)[\\/]route\.ts$/.exec(
    file.replace(/\\/g, "/")
  ) ?? [];
  return `/${dir
    .split("/")
    .filter((segment) => segment && !segment.startsWith("("))
    .join("/")}`;
}

/**
 * Routes qui appellent réellement checkBotId(), directement ou via
 * authenticateChatRequest(). C'est la seule information qui compte : c'est
 * elle qui déclenche le 403, pas le simple fait d'être un POST /api/*.
 */
function readServerCheckedRoutes(): string[] {
  const routes: string[] = [];
  for (const file of readRouteFiles("app")) {
    const source = readFileSync(file, "utf8");
    if (!/authenticateChatRequest\(|checkBotId\(/.test(source)) {
      continue;
    }
    // Le refus ne se produit que si la route sert un POST : GET et DELETE
    // passent par d'autres gardes et ne doivent pas être attestés.
    if (!/export\s+(?:async\s+)?function\s+POST\b/.test(source)) {
      continue;
    }
    routes.push(toPublicPath(file));
  }
  if (routes.length === 0) {
    throw new Error(
      "Aucune route serveur n'appelle authenticateChatRequest() — le détecteur de ce test est-il périmé ?"
    );
  }
  return routes.sort();
}

describe("protection BotID : routes serveur ↔ routes client", () => {
  it("chaque route vérifiée par checkBotId() est attestée côté client", () => {
    const clientRoutes = readClientProtectedRoutes();

    const missing = readServerCheckedRoutes().filter(
      (route) =>
        !clientRoutes.some(
          (clientRoute) => clientRoute === route || clientRoute.endsWith(route)
        )
    );

    expect(missing).toEqual([]);
  });
});