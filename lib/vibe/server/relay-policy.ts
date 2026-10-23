/**
 * VIBE — RELAIS BFF : POLITIQUE DE CHEMIN (lib/vibe/server/relay-policy.ts)
 *
 * Pourquoi ce module existe
 *
 * Vibe appelait l'API mAI **directement depuis le navigateur**, en posant
 * `Authorization: Bearer <vibe_jwt_token>` — un jeton que le client détenait.
 * L'écran « Paramètres » de l'hôte (`/settings?tab=applications`), qui vit
 * HORS de `/vibe`, n'avait donc aucun jeton à présenter : la requête partait
 * sans authentification et le backend répondait « Service Unavailable. API Key
 * missing. ».
 *
 * Le relais BFF change la donne : le client ne détient plus de secret, la
 * route serveur lit le cookie `mai_session_token` (httpOnly) et pose
 * `Authorization` vers l'amont. Mais un relais générique serait une brèche :
 * il relaierait n'importe quelle route du backend, y compris l'API publique
 * d'agents ou les endpoints d'administration.
 *
 * D'où ce module : une **liste blanche** de préfixes, et un refus de tout
 * segment suspect. Il est volontairement pur (aucun import `next/server`, pas
 * de `server-only`) pour être testable sans runtime Next — la fabrication de
 * la `Response` reste dans la route (cf. AGENTS.md §7).
 *
 * DEUX RÈGLES NON NÉGOCIABLES
 *
 *  1. **Le travail se fait sur le chemin BRUT**, jamais sur `params.path`.
 *     Next décode les segments avant de les livrer : `%2F` y redevient `/`,
 *     et une traversée encodée aurait déjà franchi la garde. On relit donc
 *     `request.nextUrl.pathname`, on découpe, on décode soi-même, et on
 *     valide le segment DÉCODÉ.
 *  2. **Le chemin amont est reconstruit segment par segment** à partir d'une
 *     liste blanche. Aucune chaîne d'origine n'est interpolée : une traversée
 *     ne peut donc pas remonter hors de `/v1`.
 */

/**
 * Préfixes amont autorisés, en `/v1/…`.
 *
 * La liste exclut l'API publique d'agents (`/v1/chat/completions` n'y est
 * pas) et les endpoints d'administration. Elle couvre les familles
 * réellement utilisées par le client Vibe (`lib/vibe/services/api/**`) :
 * fil, publications, profil, messagerie, notifications, livres, cercle,
 * stories, studio mAI, réglages, onboarding et téléversements.
 */
export const VIBE_RELAY_PREFIXES = [
  "v1/ai",
  "v1/audio",
  "v1/books",
  "v1/circle",
  "v1/dms",
  "v1/drafts",
  "v1/feed",
  "v1/log-usage",
  "v1/mai",
  "v1/me",
  "v1/models",
  "v1/notifications",
  "v1/onboarding",
  "v1/posts",
  "v1/privacy",
  "v1/profile",
  "v1/profiles",
  "v1/realtime",
  "v1/search",
  "v1/settings",
  "v1/speech",
  "v1/stories",
  "v1/trends",
  "v1/translate",
  "v1/upload-avatar",
  "v1/upload-file",
  "v1/usage",
  "v1/users",
] as const;

/**
 * Chemins qui ne passent PAS par le relais.
 *
 * L'authentification Vibe est pilotée par les Server Actions de l'hôte, qui
 * posent le cookie `mai_session_token` : la relayer donnerait au client une
 * seconde porte d'entrée, et le jeton d'un compte Vibe ne serait pas
 * nécessairement celui de la session hôte.
 */
export const VIBE_RELAY_EXCLUDED = [
  "login",
  "register",
  "resend-code",
  "verify-login",
  "verify-register",
] as const;

export type RelayDecision =
  | { ok: true; path: string }
  | { ok: false; reason: "excluded" | "not_allowed" | "unsafe_segment" };

/**
 * Un segment décodé est-il sûr d'être relayé ?
 *
 * On refuse :
 * - le segment vide (`//`) : il se saute et change la forme de la route ;
 * - `.` et `..` : la traversée ;
 * - tout segment contenant `/` ou `\` : il se scinderait en plusieurs
 *   segments une fois décodé, donc il n'était pas inerte côté amont ;
 * - le caractère NUL et les espaces de contrôle : ils cassent l'en-tête de
 *   requête plus haut.
 */
function isSafeDecodedSegment(segment: string): boolean {
  if (!segment) {
    return false;
  }
  if (segment === "." || segment === "..") {
    return false;
  }
  if (segment.includes("/") || segment.includes("\\")) {
    return false;
  }
  // Caractères de contrôle, NUL compris : ils cassent l'en-tête de requête
  // plus haut. Le test se fait sur les CODES, pas sur une expression
  // régulière — celle-ci demanderait une suppression de lint pour une
  // recherche de caractères de contrôle, c'est-à-dire l'inverse de ce que
  // la règle veut dire.
  for (let index = 0; index < segment.length; index += 1) {
    const code = segment.charCodeAt(index);
    if (code < 0x20 || code === 0x7f) {
      return false;
    }
  }
  return true;
}

/**
 * Décide du chemin amont à partir du chemin BRUT de la requête.
 *
 * @param rawPathname Chemin brut, tel que reçu — basePath compris si elle
 *   existe, et segments encodés.
 * @param basePath Préfixe de déploiement (`/demo` en démo), à retirer.
 * @returns Le chemin amont (`/v1/…`) ou la raison du refus.
 */
export function decideVibeRelayPath(
  rawPathname: string,
  basePath = ""
): RelayDecision {
  if (typeof rawPathname !== "string" || rawPathname.length === 0) {
    return { ok: false, reason: "not_allowed" };
  }

  // On retire le basePath, puis le préfixe `/api/vibe`.
  //
  // Le `basePath` est retiré s'il est là, mais la recherche du marqueur ne
  // suppose rien : Next le conserve ou le retire selon le point d'entrée (le
  // dépôt hésite déjà là-dessus, cf. `lib/security/proxy-policy.ts`). Le
  // marqueur doit être à une frontière de segment, sinon `/api/vibevil`
  // serait accepté.
  let rest = rawPathname;
  if (basePath && (rest === basePath || rest.startsWith(`${basePath}/`))) {
    rest = rest.slice(basePath.length) || "/";
  }
  const marker = "/api/vibe";
  const markerIndex = rest.indexOf(marker);
  if (markerIndex < 0) {
    return { ok: false, reason: "not_allowed" };
  }
  const afterMarker = rest.slice(markerIndex + marker.length);
  // `/api/vibevil/...` : le caractère qui suit le marqueur n'est pas un
  // séparateur de segment. Le marqueur n'est donc pas en frontière.
  if (afterMarker !== "" && !afterMarker.startsWith("/")) {
    return { ok: false, reason: "not_allowed" };
  }
  rest = afterMarker;
  if (rest === "" || rest === "/") {
    return { ok: false, reason: "not_allowed" };
  }
  if (rest.startsWith("/")) {
    rest = rest.slice(1);
  }

  const rawSegments = rest.split("/");
  const decoded: string[] = [];
  for (const raw of rawSegments) {
    if (!raw) {
      // Segment vide (`//`) : la forme de la route change, on refuse.
      return { ok: false, reason: "unsafe_segment" };
    }
    let value: string;
    try {
      value = decodeURIComponent(raw);
    } catch {
      // Séquence d'échappement invalide : on ne tente pas de deviner.
      return { ok: false, reason: "unsafe_segment" };
    }
    if (!isSafeDecodedSegment(value)) {
      return { ok: false, reason: "unsafe_segment" };
    }
    decoded.push(value);
  }

  // La forme `/api/vibe/v1/…` (ce que produit le client) et la forme courte
  // `/api/vibe/settings` aboutissent au même chemin amont.
  const withoutV1 = decoded[0] === "v1" ? decoded.slice(1) : decoded;
  if (withoutV1.length === 0) {
    return { ok: false, reason: "not_allowed" };
  }

  if ((VIBE_RELAY_EXCLUDED as readonly string[]).includes(withoutV1[0])) {
    return { ok: false, reason: "excluded" };
  }

  // La liste blanche porte le segment de tête AVEC son préfixe `/v1`. Le
  // chemin est reconstruit depuis les segments DÉCODÉS et validés, jamais
  // depuis la chaîne d'origine.
  const rebuilt = ["v1", ...withoutV1].join("/");
  const allowed = VIBE_RELAY_PREFIXES.some(
    (prefix) => rebuilt === prefix || rebuilt.startsWith(`${prefix}/`)
  );
  if (!allowed) {
    return { ok: false, reason: "not_allowed" };
  }
  // On ré-ENCODE chaque segment : le chemin amont doit être un chemin, pas
  // une suite de valeurs. Un pseudo comme `a b` devient `a%20b`, et le
  // `/` qu'un segment aurait contenu est impossible ici (refusé plus haut).
  const encoded = withoutV1.map((segment) => encodeURIComponent(segment));
  return { ok: true, path: `/v1/${encoded.join("/")}` };
}
