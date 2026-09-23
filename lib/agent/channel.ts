// Canal de diffusion d'Agent. Passer d'Alpha à Beta puis Stable ne doit
// nécessiter qu'une seule ligne : tout le reste (badge, textes, écrans) lit
// ces constantes. Aucun composant ne code « Alpha » en dur.

export type AgentChannel = "alpha" | "beta" | "stable";

export const AGENT_CHANNEL: AgentChannel = "alpha";

export const AGENT_CHANNEL_LABELS: Record<AgentChannel, string> = {
  alpha: "Alpha",
  beta: "Beta",
  stable: "Stable",
};

// Texte discret accompagnant le badge : volontairement factuel et non anxiogène.
export const AGENT_CHANNEL_NOTICES: Record<AgentChannel, string> = {
  alpha:
    "Agent évolue rapidement et certaines fonctionnalités peuvent changer.",
  beta: "Agent est en cours de stabilisation : certaines fonctionnalités peuvent encore évoluer.",
  stable: "Agent est stable et prêt pour un usage quotidien.",
};

export const AGENT_HOME_TITLE = "Sur quoi travaille-t-on ?";
export const AGENT_HOME_PLACEHOLDER = "Travaillez sur n'importe quoi";
export const AGENT_COMPOSER_ARIA_LABEL = "Décrire la tâche à confier à Agent";

export const AGENT_UPGRADE_TITLE =
  "Agent est disponible avec mAI Plus, Pro et Max.";
export const AGENT_UPGRADE_DESCRIPTION =
  "Agent enchaîne plusieurs étapes, utilise vos outils et vos fichiers pour produire un résultat complet. Il fait partie des forfaits payants.";
export const AGENT_UPGRADE_CTA = "Améliorer mon forfait";

export const AGENT_MODES = ["chat", "agent"] as const;
export type AgentMode = (typeof AGENT_MODES)[number];

// Garde partagée « identité propriétaire de la conversation ».
//
// L'ancienne comparaison acceptait aussi bien l'identifiant que l'EMAIL ou le
// NOM D'UTILISATEUR. Ces deux derniers sont modifiables par l'utilisateur (et
// peuvent être proches d'une valeur légitime) : en changer suffisait donc à
// faire coïncider son identité avec celle d'un autre compte ayant conservé
// l'ancienne valeur, c'est-à-dire à lire — ou écrire — dans ses conversations.
// Seul l'identifiant canonique, immuable et unique est accepté.
//
// MIGRATION : les conversations historiques dont `userId` contient un email ou
// un pseudonyme doivent être converties AVANT ce durcissement
// (scripts/migrate-chat-owner-canonical.ts). L'option
// `CHAT_OWNER_LEGACY_MATCH=true` rétablit temporairement l'ancienne tolérance
// pour les environnements dont la migration n'est pas terminée.
export const CHAT_OWNER_LEGACY_MATCH_ENABLED =
  process.env.CHAT_OWNER_LEGACY_MATCH === "true";

export function chatOwnerMatches(params: {
  chatUserId: string;
  email?: string | null;
  userId?: string | null;
  username?: string | null;
}): boolean {
  const { chatUserId, email, userId, username } = params;
  if (!chatUserId) {
    return false;
  }
  if (userId && chatUserId === userId) {
    return true;
  }
  if (!CHAT_OWNER_LEGACY_MATCH_ENABLED) {
    return false;
  }
  // Compatibilité temporaire, explicitement activée par l'exploitant.
  return Boolean(
    (email && chatUserId === email) || (username && chatUserId === username)
  );
}

export const AGENT_MODE_LABELS: Record<AgentMode, string> = {
  agent: "Agent",
  chat: "Chat",
};

export function isAgentMode(value: unknown): value is AgentMode {
  return (
    typeof value === "string" &&
    (AGENT_MODES as readonly string[]).includes(value)
  );
}

export type AgentChannelInfo = {
  channel: AgentChannel;
  label: string;
  notice: string;
};

export function getAgentChannelInfo(
  channel: AgentChannel = AGENT_CHANNEL
): AgentChannelInfo {
  return {
    channel,
    label: AGENT_CHANNEL_LABELS[channel],
    notice: AGENT_CHANNEL_NOTICES[channel],
  };
}
