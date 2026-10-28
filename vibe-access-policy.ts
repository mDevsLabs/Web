/**
 * Politiques d'accès Vibe réutilisées par le backend et testables sans base.
 *
 * Les requêtes SQL chargent les faits (visibilité, abonnement, blocage), puis
 * ces fonctions prennent LA décision. Une seule règle par concept, partagée
 * entre les lectures et les interactions.
 */

export type StoryVisibility = "public" | "followers" | "private" | string;

export function decideStoryInteraction(params: {
  alive: boolean;
  authorId: number;
  blockedEitherWay: boolean;
  isFollower: boolean;
  viewerId: number;
  visibility: StoryVisibility;
}): boolean {
  if (!params.alive) return false;
  if (params.viewerId === params.authorId) return true;
  if (params.blockedEitherWay) return false;
  if (params.visibility === "public") return true;
  if (params.visibility === "followers") return params.isFollower;
  // `private` (et toute valeur inconnue) : auteur seul.
  return false;
}

export type DmRecipientDecision =
  | { allowed: true }
  | { allowed: false; reason: "blocked" | "dms_disabled" | "followers_only" };

export function decideDmRecipient(params: {
  blockedEitherWay: boolean;
  dmsEnabled: boolean;
  policy: string;
  recipientFollowsSender: boolean;
  settingsPresent: boolean;
}): DmRecipientDecision {
  if (params.blockedEitherWay) {
    return { allowed: false, reason: "blocked" };
  }
  if (!params.settingsPresent) {
    // Table de préférences absente : comportement historique, réception ouverte.
    return { allowed: true };
  }
  const policy = params.policy || "everyone";
  if (!params.dmsEnabled || policy === "nobody") {
    return { allowed: false, reason: "dms_disabled" };
  }
  if (policy === "following" && !params.recipientFollowsSender) {
    return { allowed: false, reason: "followers_only" };
  }
  return { allowed: true };
}
