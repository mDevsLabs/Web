/**
 * Garde d'origine des mutations Quizzly.
 *
 * Le cookie de session suffit à identifier le compte, pas à prouver que
 * l'appel vient de l'interface : une page tierce pourrait sinon débiter
 * des gemmes. Même règle que les réglages Blackline.
 */

export function origineConfiance(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site") {
    return false;
  }
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
