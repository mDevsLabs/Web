import { isPaidTier, normalizeTier } from "@/lib/auth/plan";

// Dérivation du tier « affiché » à partir de la charge utile de /api/settings.
// Logique extraite de hooks/use-tier.ts pour être testable sans React ni SWR.
//
// Règle clé (seconde moitié du correctif « abonné Plus bloqué hors de l'espace
// Agent ») : `loaded` signifie « tier CONNU » — l'API a répondu avec des
// données, sans erreur en cours. En chargement OU en échec réseau, `loaded`
// reste false : l'appelant (garde de mode du shell) ne doit alors PAS
// verrouiller le curseur, car interpréter l'absence de données comme « Free »
// réassignait silencieusement les abonnés payants à l'accueil Chat. Le serveur
// arbitre de toute façon à l'envoi (plan_required sur /api/chat et /api/agent).

export type TierInfo = {
  isFree: boolean;
  isMax: boolean;
  isPaid: boolean;
  isPlus: boolean;
  isPro: boolean;
  /** true uniquement si le tier est CONNU (réponse reçue, pas d'erreur). */
  loaded: boolean;
  normalized: string;
  raw: string;
};

// Représentation structurelle de SettingsPayload (hooks/use-settings) sans
// dépendre du module hook : lib ne doit pas importer hooks/.
export type TierSettingsSource = {
  aiUsage?: { tier?: string } | null;
  imagesUsage?: { plan?: string } | null;
  speechUsage?: { tier?: string } | null;
  user?: { tier?: string } | null;
};

export type TierFetchState = {
  data?: TierSettingsSource;
  error?: unknown;
  isLoading?: boolean;
};

export function resolveTierInfo(state: TierFetchState): TierInfo {
  const { data, error, isLoading } = state;
  // CONNU = réponse reçue, sans erreur en cours ni chargement en cours. Une
  // charge utile vide (payload sans champ tier) reste « connue » : le serveur
  // a répondu, et le repli "Free" ne s'applique qu'à ce cas explicite.
  const known = !isLoading && !error && data !== null && data !== undefined;
  const raw =
    data?.user?.tier ||
    data?.aiUsage?.tier ||
    data?.imagesUsage?.plan ||
    data?.speechUsage?.tier ||
    "Free";
  const normalized = normalizeTier(raw);
  return {
    isFree: normalized === "free",
    isMax: normalized === "max",
    isPaid: isPaidTier(normalized),
    isPlus: normalized === "plus",
    isPro: normalized === "pro",
    loaded: known,
    normalized,
    raw,
  };
}
