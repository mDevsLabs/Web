// Source unique de vérité côté Next pour l'affichage des limites par forfait.
// Miroir de TIER_LIMITS / TIER_SPEECH_LIMITS / TIER_DAILY_IMAGE_LIMITS /
// STORAGE_LIMITS_BYTES du backend Val Town (config.ts) — toute évolution de
// forfait doit être répercutée des deux côtés.

export const TIER_KEYS = ["free", "plus", "pro", "max"] as const;
export type TierKey = (typeof TIER_KEYS)[number];

export type TierLimits = {
  label: string;
  chatWeeklyTokens: number;
  speechWeeklyTokens: number;
  imagesPerDay: number;
  storageBytes: number;
  memoryEntries: number;
  /**
   * Nombre maximum d'agents personnalisés par utilisateur.
   * `null` = illimité (forfait Max).
   */
  agents: number | null;
  /**
   * Longueur maximale des instructions personnalisées.
   * `null` = illimité côté produit (forfait Max) — mais jamais illimité côté
   * technique : voir CUSTOM_INSTRUCTIONS_HARD_CAP et
   * getCustomInstructionsEffectiveMax().
   */
  customInstructions: number | null;
};

/**
 * Garde-fou technique de la longueur des instructions personnalisées.
 *
 * Le forfait Max affiche « illimité », ce qui est vrai côté produit : rien
 * dans le produit ne l'empêche d'écrire 50 000 caractères. Mais une valeur
 * non bornée est un risque opérationnel, pas un avantage : elle alimente
 * chaque requête de chat (system prompt), sans borner la taille du corps de
 * requête ni le coût du prompt. 100 000 caractères reste très au-dessus de
 * tout usage réel, tout en gardant le payload fini et prévisible.
 *
 * Ne pas confondre ce plafond technique avec un plafond produit : une
 * transgression de CUSTOM_INSTRUCTIONS_HARD_CAP n'est pas un problème de
 * forfait, et ne doit donc jamais proposer une mise à niveau.
 */
export const CUSTOM_INSTRUCTIONS_HARD_CAP = 100_000;

const GiB = 1024 * 1024 * 1024;

export const TIER_LIMITS: Record<TierKey, TierLimits> = {
  free: {
    agents: 0,
    chatWeeklyTokens: 10_000_000,
    customInstructions: 2000,
    imagesPerDay: 5,
    label: "Free",
    memoryEntries: 50,
    speechWeeklyTokens: 30_000_000,
    storageBytes: 10 * GiB,
  },
  max: {
    // Forfait Max : nombre d'agents illimité, instructions sans plafond produit.
    agents: null,
    chatWeeklyTokens: 50_000_000,
    customInstructions: null,
    imagesPerDay: 35,
    label: "Max",
    memoryEntries: 150,
    speechWeeklyTokens: 300_000_000,
    storageBytes: 60 * GiB,
  },
  plus: {
    agents: 15,
    chatWeeklyTokens: 20_000_000,
    customInstructions: 3000,
    imagesPerDay: 10,
    label: "Plus",
    memoryEntries: 75,
    speechWeeklyTokens: 75_000_000,
    storageBytes: 20 * GiB,
  },
  pro: {
    agents: 25,
    chatWeeklyTokens: 30_000_000,
    customInstructions: 5000,
    imagesPerDay: 20,
    label: "Pro",
    memoryEntries: 100,
    speechWeeklyTokens: 150_000_000,
    storageBytes: 40 * GiB,
  },
};

export function normalizeTierKey(tier?: string | null): TierKey {
  const t = (tier || "free").toLowerCase().trim();
  if (t === "gratuit") {
    return "free";
  }
  return (TIER_KEYS as readonly string[]).includes(t) ? (t as TierKey) : "free";
}

export function getTierLimits(tier?: string | null): TierLimits {
  return TIER_LIMITS[normalizeTierKey(tier)];
}

export function getTierChatWeeklyLimit(tier?: string | null): number {
  return getTierLimits(tier).chatWeeklyTokens;
}

export function getTierSpeechWeeklyLimit(tier?: string | null): number {
  return getTierLimits(tier).speechWeeklyTokens;
}

export function getTierImageDailyLimit(tier?: string | null): number {
  return getTierLimits(tier).imagesPerDay;
}

export function getTierStorageBytes(tier?: string | null): number {
  return getTierLimits(tier).storageBytes;
}

export function getTierMemoryEntries(tier?: string | null): number {
  return getTierLimits(tier).memoryEntries;
}

/**
 * Nombre maximum d'agents personnalisés pour un forfait.
 * `null` = illimité : l'appelant ne doit alors effectuer aucune vérification.
 */
export function getTierAgentLimit(tier?: string | null): number | null {
  return getTierLimits(tier).agents;
}

export function isAgentLimitUnlimited(tier?: string | null): boolean {
  return getTierAgentLimit(tier) === null;
}

/**
 * Vrai si l'utilisateur a atteint la limite d'agents de son forfait.
 * Un quota illimité ne peut jamais être dépassé.
 */
export function isAgentQuotaExceeded(
  tier: string | null | undefined,
  currentCount: number
): boolean {
  const limit = getTierAgentLimit(tier);
  return limit !== null && currentCount >= limit;
}

/** Message d'erreur affiché quand la limite est atteinte. */
export function agentQuotaMessage(limit: number): string {
  return `Limite de ${limit} agents atteinte. Supprimez un agent avant d'en créer un nouveau.`;
}

/**
 * Longueur maximale des instructions personnalisées — plafond PRODUIT.
 * `null` = illimité (forfait Max).
 *
 * C'est cette valeur qu'affichent le libellé et le compteur de l'interface.
 * Pour valider une écriture, utiliser getCustomInstructionsEffectiveMax().
 */
export function getTierCustomInstructionsMax(
  tier?: string | null
): number | null {
  return getTierLimits(tier).customInstructions;
}

/**
 * Longueur maximale des instructions personnalisées — plafond EFFECTIF.
 * Jamais `null` : le forfait Max retombe sur CUSTOM_INSTRUCTIONS_HARD_CAP.
 *
 * C'est la seule valeur à utiliser pour borner une saisie ou un schéma Zod.
 * Un `.max(null)` n'aurait aucun sens et laisserait le champ non borné.
 */
export function getCustomInstructionsEffectiveMax(
  tier?: string | null
): number {
  return getTierCustomInstructionsMax(tier) ?? CUSTOM_INSTRUCTIONS_HARD_CAP;
}

/**
 * Vrai si la longueur demandée dépasse le plafond produit du forfait.
 * Sert à distinguer « votre forfait est trop petit » (proposer un upgrade)
 * de « garde-fou technique » (aucune action produit possible).
 */
export function exceedsCustomInstructionsProductLimit(
  tier: string | null | undefined,
  length: number
): boolean {
  const productMax = getTierCustomInstructionsMax(tier);
  return productMax !== null && length > productMax;
}
