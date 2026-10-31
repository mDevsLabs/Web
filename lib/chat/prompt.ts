import type { ChatRequestContext } from "@/lib/chat/context";
import { getCustomCommandById } from "@/lib/db/queries";
import { isPluginOnlyToolId } from "@/lib/plugins/catalog";
import {
  composePersonalInstructions,
  type PersonalBlock,
} from "@/lib/prompts/personal";

export type PromptAddendumResult = {
  /**
   * Bloc d'instructions personnalisées, DÉLIMITÉ et placé en dernier par
   * buildChatSystemPrompt. Il ne contient plus de consignes de socle : le
   * contrat de rôle et les sections de capacités sont produits par lib/prompts/.
   */
  effectiveAddendum: string;
  // Outils demandés (one-shot + skill), sans les plugins indisponibles.
  // L'éligibilité (capacités, fantôme, session) est décidée plus tard, par
  // resolveActiveChatTools : ce module ne réécrit plus la liste.
  requestedTools: string[];
  // Outils fournis par un plugin non installé/activé : signalés au modèle pour
  // qu'il oriente l'utilisateur au lieu de simuler un résultat.
  unavailableTools: string[];
};

/**
 * Compose le bloc personnalisé du Chat. L'ordre est FIXE : ce qui structure le
 * plus (assistant, projet) avant ce qui est le plus ponctuel (commande de ce
 * message). Les blocs vides sont retirés — jamais laissés à vide.
 */
export async function buildPromptAddendum(
  ctx: ChatRequestContext,
  options: { availablePluginToolIds?: string[] } = {}
): Promise<PromptAddendumResult> {
  // Un outil de plugin n'est annoncé au modèle que s'il est réellement
  // disponible (plugin installé + forfait payant, décidé par l'appelant).
  const availablePluginToolIds = new Set(options.availablePluginToolIds ?? []);

  // Seuls les identifiants fournis par un plugin peuvent être retirés : un
  // outil implémenté nativement reste disponible quel que soit l'état des
  // plugins (une validation interdit d'ailleurs toute collision d'id).
  const unavailableTools: string[] = [];
  const combinedEnabledTools = Array.from(
    new Set([
      ...(Array.isArray(ctx.enabledTools) ? ctx.enabledTools : []),
      ...ctx.skillTools,
    ])
  );
  const requestedTools: string[] = combinedEnabledTools.filter((toolId) => {
    if (isPluginOnlyToolId(toolId) && !availablePluginToolIds.has(toolId)) {
      unavailableTools.push(toolId);
      return false;
    }
    return true;
  });

  // Commande personnalisée : consignes à appliquer à CE message uniquement. Le
  // nom est relu en base pour être fidèle à ce que l'utilisateur a enregistré.
  let customCommandLabel = "COMMANDE PERSONNALISÉE";
  let customCommandBody: string | null = null;
  const pendingPrompt = ctx.pendingPrompt;
  if (pendingPrompt?.text && pendingPrompt.text.trim().length > 0) {
    let commandName: string | null = null;
    if (pendingPrompt.commandId && !ctx.isFreeUser) {
      try {
        const command = await getCustomCommandById({
          id: pendingPrompt.commandId,
          userId: ctx.userId,
        });
        commandName = command?.name ?? null;
      } catch {}
    }
    customCommandLabel = commandName
      ? `COMMANDE PERSONNALISÉE « ${commandName} »`
      : "COMMANDE PERSONNALISÉE";
    customCommandBody = pendingPrompt.text.trim();
  }

  const agentSkillBlock =
    ctx.agentSkillInstructions.length > 0
      ? ctx.agentSkillInstructions.join("\n\n")
      : null;

  // La mémoire n'est pas répétée ici : stream.ts la place déjà dans
  // memorySection. Un second bloc « MÉMOIRE » doublait chaque souvenir.
  const blocks: PersonalBlock[] = [
    { body: ctx.agentInstructions, label: "ASSISTANT ACTIF" },
    {
      body: ctx.userCustomEnabled ? ctx.userCustomInstructions : null,
      label: "INSTRUCTIONS DE L'UTILISATEUR",
    },
    {
      body: ctx.projectCustomInstructions,
      label: "CONTEXTE DU PROJET",
    },
    {
      body: ctx.projectFilesPromptBlock,
      label: "FICHIERS DU PROJET",
    },
    {
      body: ctx.chatCustomInstructions,
      label: "INSTRUCTIONS DE CETTE CONVERSATION",
    },
    { body: ctx.skillInstructions, label: "COMPÉTENCE ACTIVE" },
    { body: agentSkillBlock, label: "COMPÉTENCES DE L'ASSISTANT" },
    { body: customCommandBody, label: customCommandLabel },
    ...(unavailableTools.length > 0
      ? [
          {
            body: `${unavailableTools.join(", ")} : le plugin correspondant n'est pas installé ou activé pour ce compte (page Applications → Plugins, réservée aux forfaits payants). Ne simule jamais leur résultat : indique brièvement à l'utilisateur comment les activer.`,
            label: "OUTILS DEMANDÉS MAIS INDISPONIBLES",
          },
        ]
      : []),
    ...(ctx.isGhostMode
      ? [
          {
            body: "Cette discussion est éphémère et confidentielle, elle n'est pas enregistrée. La génération d'image, la synthèse audio (voix et podcast) et la modification de profil sont strictement indisponibles dans ce mode.",
            label: "MODE FANTÔME",
          },
        ]
      : []),
  ];

  return {
    effectiveAddendum: composePersonalInstructions(blocks) ?? "",
    requestedTools,
    unavailableTools,
  };
}
