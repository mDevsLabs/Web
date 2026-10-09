/** Les mutations par cookie doivent venir de l'origine de la route ; Capacitor charge cette même origine HTTPS. */
export function trustedWakiesOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site") return false;
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
