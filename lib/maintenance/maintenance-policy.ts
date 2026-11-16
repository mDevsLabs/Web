import { cheminSansBasePath } from "@/lib/security/proxy-policy";

/**
 * Routes et préfixes autorisés pendant la période de maintenance.
 * Tout ce qui n'est pas dans cette liste est strictement bloqué.
 */
export const PREFIXES_EXEMPTES_MAINTENANCE = [
  "/maintenance",
  "/api/maintenance/status",
  "/api/maintenance/bypass",
  "/api/app-version",
  "/ping",
  "/_next/",
] as const;

/**
 * Détermine si un chemin d'URL est exempté du blocage de maintenance.
 */
export function estExempteDeMaintenance(
  pathname: string,
  basePath = ""
): boolean {
  const normalise = cheminSansBasePath(pathname, basePath);

  // Fichiers statiques indispensables au rendu visuel
  const isStatic =
    !normalise.startsWith("/api/") &&
    /\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot)$/i.test(normalise);

  if (isStatic) {
    return true;
  }

  return PREFIXES_EXEMPTES_MAINTENANCE.some(
    (prefix) => normalise === prefix || normalise.startsWith(prefix)
  );
}

export const MESSAGE_MAINTENANCE_API =
  "Une maintenance de nos serveurs est en cours. Nous faisons tout notre possible pour rétablir les services au plus vite.";
