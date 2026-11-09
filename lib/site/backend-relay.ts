// Politique du relais BFF du backend mAI pour le Site (issue #10).
//
// Pur et testable : la décision de chemin et le retrait du jeton de session
// vivent ici, la fabrication des `Response` reste dans la route
// `app/(chat)/api/site/backend/[...path]/route.ts`.
//
// POURQUOI : le Site appelait le backend directement depuis le navigateur,
// avec un jeton JWT copié dans `localStorage` et dans des cookies lisibles —
// la protection HttpOnly était perdue. Le relais lit le cookie httpOnly,
// fabrique l'en-tête `Authorization` côté serveur, et le jeton ne revient
// jamais dans le renderer.

/** Régime d'authentification d'un chemin relayé. */
export type SiteBackendAuth = "public" | "session";

/**
 * Chemins accessibles sans session (création de compte et OTP). Les
 * réponses de ces chemins peuvent porter un jeton : la route le pose alors
 * dans le cookie httpOnly et le retire du corps.
 */
const PUBLIC_PATHS = new Set([
  "/login",
  "/register",
  "/verify-login",
  "/verify-register",
  "/resend-code",
]);

/** Chemins réservés à une session (cookie httpOnly) valide. */
const SESSION_PATHS = new Set([
  "/usage",
  "/cloud/storage",
  "/v1/audio/usage",
  "/verify-code",
  "/update-profile",
  "/upload-avatar",
  "/logout",
]);

/**
 * Segments acceptés : un chemin relayé ne contient ni point, ni séparateur
 * encodé, ni extension exécutable — l'upstream est reconstruit segment par
 * segment.
 */
const SAFE_SEGMENT = /^[A-Za-z0-9_-]+$/;

export interface SiteBackendDecision {
  auth: SiteBackendAuth;
  path: string;
}

export function resolveSiteBackendPath(
  segments: readonly string[]
): SiteBackendDecision | null {
  if (segments.length === 0 || segments.length > 3) return null;
  for (const segment of segments) {
    if (!SAFE_SEGMENT.test(segment)) return null;
  }
  const path = `/${segments.join("/")}`;
  if (PUBLIC_PATHS.has(path)) return { auth: "public", path };
  if (SESSION_PATHS.has(path)) return { auth: "session", path };
  return null;
}

/**
 * Retire `token` d'une charge utile JSON : un jeton de session ne doit jamais
 * atteindre le renderer, quelle que soit la réponse de l'amont.
 */
export function stripSessionToken(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }
  const clone: Record<string, unknown> = {
    ...(payload as Record<string, unknown>),
  };
  delete clone.token;
  return clone;
}
