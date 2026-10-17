/**
 * ============================================================================
 * VIBE — CLIENT POSTGRES DES LECTEURS SERVEUR (lib/vibe/server/db.ts)
 * ============================================================================
 *
 * Pourquoi ce client dédié plutôt que `getRawClient()` de `lib/db/queries.ts` :
 * celui-ci passe par `dbReady()` qui exécute le bootstrap de migrations de
 * l'hôte (dizaines d'`ALTER`). Un lecteur Vibe ne doit ni dépendre de ce
 * bootstrap ni le déclencher. Les tables Vibe appartiennent au backend Val
 * Town ; ici on ne fait que les LIRE, sur le même Neon Postgres que lui
 * (`DATABASE_URL` partagé, cf. `config.ts:206` côté backend).
 *
 * Politique DDL : lecture seule absolue. Aucun `CREATE`, aucun `ALTER`. Une
 * table ou colonne absente ⇒ le lecteur retourne `null` et la page retombe
 * sur son appel API habituel, qui laisse le backend réparer via ses `ensure*`.
 */
import "server-only";
import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import { resolveDatabaseUrl } from "@/lib/db/connection-string";

let cached: NeonQueryFunction<false, false> | null = null;
let lastUrl: string | null = null;

/** Bascule sur le pooler Neon (-pooler), exactement comme le backend. */
function withPooler(rawUrl: string): string {
  if (rawUrl.includes(".neon.tech") && !rawUrl.includes("-pooler")) {
    return rawUrl.replace(/@([^:]+)(\.neon\.tech)/, "@$1-pooler$2");
  }
  return rawUrl;
}

/**
 * Client HTTP Neon, ou `null` si aucune URL de connexion n'est configurée.
 * `null` désactive l'hydratation : les pages Vibe gardent leur comportement
 * actuel (appel API depuis le navigateur), jamais elles ne cassent.
 */
export function vibeSql(): NeonQueryFunction<false, false> | null {
  const raw = resolveDatabaseUrl();
  if (!raw) {
    return null;
  }
  const url = withPooler(raw);
  if (!cached || lastUrl !== url) {
    cached = neon(url);
    lastUrl = url;
  }
  return cached;
}
