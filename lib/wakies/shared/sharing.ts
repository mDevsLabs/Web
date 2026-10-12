/** Un partage pointe vers une fiche publiée, jamais vers une conversation privée. */
export const WAKIE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type FicheWakiePartagee = {
  id: string;
  avatar: string | null;
  images: { id: string; alt: string; url: string | null }[];
  profil: {
    avatarUrl: string | null;
    bannerUrl: string | null;
    bio: string;
    handle: string | null;
    isPublic: true;
    links: string[];
    name: string;
    personaPubliee: string;
  };
};

export function cheminPartageWakie(id: string): string {
  if (!WAKIE_ID_PATTERN.test(id))
    throw new Error("Identifiant de Wakie invalide.");
  return `/wakies/share/${id}`;
}

export function lienPartageWakie(
  id: string,
  origine: string,
  base = ""
): string {
  const url = new URL(origine);
  if (!["https:", "http:"].includes(url.protocol))
    throw new Error("Origine de partage invalide.");
  const prefixe = base ? `/${base.replace(/^\/+|\/+$/g, "")}` : "";
  return new URL(`${prefixe}${cheminPartageWakie(id)}`, url.origin).href;
}

export function estPagePartageWakie(pathname: string, base = ""): boolean {
  const chemin =
    base && pathname.startsWith(`${base}/`)
      ? pathname.slice(base.length)
      : pathname;
  const id = chemin.startsWith("/wakies/share/")
    ? chemin.slice("/wakies/share/".length)
    : "";
  return WAKIE_ID_PATTERN.test(id);
}
