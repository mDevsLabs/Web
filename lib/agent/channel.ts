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

// Garde partagée « identité propriétaire de la conversation » : chat.userId a
// été enregistré selon des variantes historiques (id, email, username). Une
// seule définition pour le contrôle d'envoi (lib/chat/context.ts) et le
// contrôle de lecture (/api/messages), sinon les deux chemins divergent.
export function chatOwnerMatches(params: {
  chatUserId: string;
  email?: string | null;
  userId?: string | null;
  username?: string | null;
}): boolean {
  const { chatUserId, email, userId, username } = params;
  return Boolean(
    chatUserId &&
      (chatUserId === userId || chatUserId === email || chatUserId === username)
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
