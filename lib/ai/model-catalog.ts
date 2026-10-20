/**
 * Catalogue de modèles : source unique des endpoints et du rythme de
 * revalidation.
 *
 * Le catalogue exposé par l'API mAI bouge : un modèle est ajouté, retiré ou
 * devient accessible selon le forfait. Un sélecteur figé propose donc des
 * modèles retirés, et tarde à montrer les nouveaux. D'où deux règles :
 *
 * 1. **Périodique** — toutes les listes se revalident toutes les 10 minutes,
 *    même sans interaction. C'est le filet de sécurité quand l'utilisateur
 *    laisse l'onglet ouvert.
 * 2. **Au changement de modèle** — sélectionner un modèle revalide les
 *    catalogues : c'est le moment où l'utilisateur regarde le catalogue, donc
 *    le moment où il doit être à jour.
 *
 * Les clés SWR sont construites ici et nulle part ailleurs : le revalidation
 * global (par `useSWRConfig().mutate`) n'atteint que les clés exactement
 * identiques à celles du `useSWR` d'origine. Une clé écrite à la main dans
 * deux fichiers diverge au premier caractère, et le rafraîchissement devient
 * un silence.
 */

/** Intervalle de revalidation du catalogue de modèles (10 minutes). */
export const MODEL_CATALOG_REFRESH_INTERVAL = 600_000;

/** Sources de catalogue exposées par l'hôte mAI (routes Next). */
export const MODEL_CATALOG_ENDPOINTS = {
  chat: "/api/models",
  images: "/api/models/images",
  speech: "/api/models/speech",
} as const;

/** Sources de catalogue exposées par le Site officiel (routes BFF). */
export const SITE_MODEL_CATALOG_ENDPOINTS = {
  chat: "/api/site/v1/models",
  images: "/api/site/v1/models/images",
  speech: "/api/site/v1/models/audio",
} as const;

export type ModelCatalogSource = keyof typeof MODEL_CATALOG_ENDPOINTS;

/**
 * Préfixe de base de l'hôte (sous-chemin de déploiement). Les clés SWR
 * doivent le porter, sinon la même route existe deux fois dans le cache.
 */
export function modelCatalogKey(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}

/**
 * Toutes les clés de catalogue, hôte et Site confondues.
 *
 * La revalidation globale passe par cette liste : changer de modèle dans le
 * sélecteur de l'hôte doit aussi rafraîchir le catalogue affiché par le
 * playground du Site, et réciproquement. Les deux lisent le même backend
 * (`/v1/models` filtré par le tier) : un catalogue périmé d'un côté l'est
 * forcément de l'autre.
 */
export const MODEL_CATALOG_SWR_KEYS: readonly string[] = [
  ...Object.values(MODEL_CATALOG_ENDPOINTS),
  ...Object.values(SITE_MODEL_CATALOG_ENDPOINTS),
].map(modelCatalogKey);
