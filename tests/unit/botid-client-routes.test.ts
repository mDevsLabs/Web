import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Régression : le mode Agent renvoyait « Vous n'avez pas l'autorisation
// d'accéder à cette ressource » dès l'envoi du message. Cause : la route
// serveur /api/agent appelle checkBotId() (via authenticateChatRequest) alors
// que la protection BotID côté client (instrumentation-client.ts) ne couvrait
// que /api/chat. Sans attestation client, Vercel classe la requête d'un
// utilisateur légitime comme un bot en production → access_denied.
//
// Ce test lie les deux listes : toute route vérifiée côté serveur doit être
// déclarée côté client, sinon l'app se brise en production uniquement.

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

/** Routes serveur qui appellent checkBotId() (directement ou via authenticateChatRequest). */
const SERVER_CHECKED_ROUTES = [
  "/api/chat",
  "/api/agent",
  "/api/agent/schedules",
];

describe("protection BotID : routes serveur ↔ routes client", () => {
  it("chaque route vérifiée par checkBotId() est attestée côté client", () => {
    const clientRoutes = readClientProtectedRoutes();

    const missing = SERVER_CHECKED_ROUTES.filter(
      (route) =>
        !clientRoutes.some(
          (clientRoute) => clientRoute === route || clientRoute.endsWith(route)
        )
    );

    expect(missing).toEqual([]);
  });
});
