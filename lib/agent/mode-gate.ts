import { isAgentMode, type AgentMode } from "@/lib/agent/channel";

// Résolution de l'expérience affichée par le shell principal : « chat »,
// « agent », ou « blocked » avec une raison exploitable par l'interface.
//
// Règle centrale : le mode est un CHOIX D'INTERFACE, pas une autorisation.
// Le serveur reste la garde réelle (plan_required sur /api/chat, /api/agent).
// Côté client, on ne verrouille que sur des données CONNUES :
// - `agent.enabled` à false → indisponible pour tout le monde ;
// - forfait gratuit CONNU (tier chargé) → dialogue d'upgrade ;
// - tier EN COURS DE CHARGEMENT ou en échec de récupération → on NE force PAS
//   le retour à Chat : l'utilisateur choisi son mode, la garde serveur
//   arbitre à l'envoi. (Avant ce correctif, un échec de /api/agent/flags
//   mettait `tier = "free"` en cache SWR et réassignait silencieusement les
//   abonnés Plus à l'accueil Chat — bug « impossible de passer en Agent ».)
export type ChatExperience =
  | { status: "chat" }
  | { status: "agent" }
  | { reason: "disabled" | "plan"; status: "blocked" };

export type ChatExperienceInput = {
  agentEnabled: boolean;
  mode: string;
  /** tier connu uniquement s'il est chargé ; `null` = chargement / échec. */
  tier: string | null;
};

export function isTierKnownFree(tier: string | null | undefined): boolean {
  if (typeof tier !== "string") {
    return false;
  }
  const normalized = tier.trim().toLowerCase();
  return normalized === "free";
}

export function resolveChatExperience(
  input: ChatExperienceInput
): ChatExperience {
  const { agentEnabled, mode, tier } = input;

  if (!agentEnabled) {
    return { reason: "disabled", status: "blocked" };
  }

  // Mode demandé par l'utilisateur, borné aux valeurs connues. Un stockage
  // corrompu retombe sur « chat » sans jamais lever.
  const requestedMode: AgentMode = isAgentMode(mode) ? mode : "chat";

  if (requestedMode === "chat") {
    return { status: "chat" };
  }

  // mode === "agent" : autorisé tant que le tier n'est pas CONNU comme free.
  // Un tier inconnu (chargement, échec réseau, valeur exotique) laisse passer :
  // le serveur tranche à la requête.
  if (isTierKnownFree(tier)) {
    return { reason: "plan", status: "blocked" };
  }
  return { status: "agent" };
}

/** Le sélecteur doit-il afficher le dialogue d'upgrade plutôt qu'un toast ? */
export function blockedExperienceUsesUpgradeDialog(
  experience: ChatExperience
): boolean {
  return experience.status === "blocked" && experience.reason === "plan";
}
