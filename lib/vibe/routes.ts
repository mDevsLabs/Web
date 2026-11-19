/**
 * Routage Vibe : préfixe canonique et utilitaires de manipulation d'URLs
 * pour les services Vibe et l'App Router Next.js.
 */

export const VIBE_BASE_PATH = "/vibe";

/**
 * Convertit un chemin Vibe (« relatif ») en URL absolue (« /vibe/... »).
 */
export function toVibePath(to: string): string {
  if (!to || to === "/" || to === "") {
    return VIBE_BASE_PATH;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(to) || to.startsWith("//")) {
    return to;
  }
  const [cheminSansSuffixe, suffixe = ""] = to.split(/([?#].*)/, 2);
  const chemin = cheminSansSuffixe.trim();

  if (chemin === VIBE_BASE_PATH || chemin === `${VIBE_BASE_PATH}/`) {
    return `${VIBE_BASE_PATH}${suffixe}`;
  }
  if (chemin.startsWith(`${VIBE_BASE_PATH}/`)) {
    return `${chemin}${suffixe}`;
  }
  const normalise = chemin.startsWith("/") ? chemin : `/${chemin}`;
  const absolu =
    normalise === "/" ? VIBE_BASE_PATH : `${VIBE_BASE_PATH}${normalise}`;
  return `${absolu}${suffixe}`;
}

/**
 * Supprime le préfixe `/vibe` pour réinjecter le chemin dans le sous-routeur Vibe.
 */
export function stripVibeBasePath(pathname: string): string {
  if (pathname === VIBE_BASE_PATH) {
    return "/";
  }
  if (pathname.startsWith(`${VIBE_BASE_PATH}/`)) {
    return pathname.slice(VIBE_BASE_PATH.length);
  }
  return pathname;
}
