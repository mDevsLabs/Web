import { TOOL_SYSTEM_HINTS } from "@/lib/ai/tools/config";
import type { ChatRequestContext } from "@/lib/chat/context";
import type { MemoryContext } from "@/lib/chat/memory";
import { getCustomCommandById } from "@/lib/db/queries";
import { isPluginOnlyToolId } from "@/lib/plugins/catalog";
import { getPluginSystemHints } from "@/lib/plugins/server";

export type PromptAddendumResult = {
  effectiveAddendum: string;
  // Liste des outils demandés (one-shot + skill), filtrée selon le mode fantôme
  requestedTools: string[];
  // Outils fournis par un plugin non installé/activé : signalés au modèle pour
  // qu'il oriente l'utilisateur au lieu de simuler un résultat.
  unavailableTools: string[];
};

export async function buildPromptAddendum(
  ctx: ChatRequestContext,
  memoryCtx: MemoryContext,
  options: { availablePluginToolIds?: string[] } = {}
): Promise<PromptAddendumResult> {
  // Un outil de plugin n'est annoncé au modèle que s'il est réellement
  // disponible (plugin installé + forfait payant, décidé par l'appelant).
  const availablePluginToolIds = new Set(options.availablePluginToolIds ?? []);
  let effectiveAddendum = "";

  if (ctx.agentInstructions) {
    effectiveAddendum = `AGENT ACTIF — Instructions prioritaires de l'agent :\n${ctx.agentInstructions}`;
  }
  if (ctx.userCustomEnabled && ctx.userCustomInstructions) {
    effectiveAddendum = `${effectiveAddendum}\n\nInstructions personnalisées de l'utilisateur (à respecter en priorité):\n${ctx.userCustomInstructions}`;
  }
  if (memoryCtx.userMemoryBlock) {
    effectiveAddendum = `${effectiveAddendum}\n\n${memoryCtx.userMemoryBlock}`;
  }
  if (ctx.projectCustomInstructions) {
    effectiveAddendum = `${effectiveAddendum}\n\nContexte et instructions du dossier/projet :\n${ctx.projectCustomInstructions}`;
  }
  if (ctx.projectFilesPromptBlock) {
    effectiveAddendum = `${effectiveAddendum}\n\n${ctx.projectFilesPromptBlock}`;
  }
  if (memoryCtx.projectMemoryBlock) {
    effectiveAddendum = `${effectiveAddendum}\n\n${memoryCtx.projectMemoryBlock}`;
  }
  if (ctx.chatCustomInstructions) {
    effectiveAddendum = `${effectiveAddendum}\n\nInstructions spécifiques à cette discussion:\n${ctx.chatCustomInstructions}`;
  }
  if (ctx.skillInstructions) {
    effectiveAddendum = `${effectiveAddendum}\n\nCOMPETENCE / SKILL ACTIF POUR CETTE DISCUSSION :\n${ctx.skillInstructions}`;
  }
  // Skills associés à l'Agent : leurs instructions font partie du contexte
  // même lorsqu'aucun Skill n'est sélectionné pour la discussion courante.
  if (ctx.agentSkillInstructions.length > 0) {
    effectiveAddendum = `${effectiveAddendum}\n\nSKILLS DE L'AGENT ACTIF :\n${ctx.agentSkillInstructions.join("\n\n")}`;
  }
  if (ctx.isGhostMode) {
    effectiveAddendum += `\n\nMODE FANTÔME ACTIF : Cette discussion est éphémère et confidentielle (non enregistrée). L'outil de génération d'image et l'outil de modification de profil sont strictement indisponibles dans ce mode.`;
  }

  // One-shot tools + outils issus du skill actif
  const combinedEnabledTools = Array.from(
    new Set([
      ...(Array.isArray(ctx.enabledTools) ? ctx.enabledTools : []),
      ...ctx.skillTools,
    ])
  );
  // Seuls les identifiants fournis par un plugin peuvent être retirés : un
  // outil implémenté nativement reste disponible quel que soit l'état des
  // plugins (une validation interdit d'ailleurs toute collision d'id).
  const unavailableTools: string[] = [];
  const requestedTools: string[] = combinedEnabledTools.filter((t) => {
    if (isPluginOnlyToolId(t) && !availablePluginToolIds.has(t)) {
      unavailableTools.push(t);
      return false;
    }
    return (
      !ctx.isGhostMode ||
      (t !== "imageGenerate" &&
        t !== "audioGenerate" &&
        t !== "updateAccountProfile" &&
        t !== "updateProfilePicture" &&
        (t !== "memory" || memoryCtx.ghostMemoryEnabled))
    );
  });
  if (requestedTools.length > 0) {
    // Les hints des plugins complètent (et peuvent surcharger) ceux des outils
    // natifs : source unique côté registre de plugins.
    const toolHints: Record<string, string> = {
      ...TOOL_SYSTEM_HINTS,
      ...getPluginSystemHints(),
    };
    const listed = requestedTools.map((t) => toolHints[t] || t).join(", ");
    effectiveAddendum += `\n\nOUTILS ACTIVÉS POUR CE MESSAGE — UTILISATION EXTRÊMEMENT RECOMMANDÉE SI PERTINENT : ${listed}. Tu DOIS les utiliser dès que la demande s'y prête, ne les ignore pas. Si plusieurs outils sont activés, choisis le plus pertinent. Pour l'audio, ne demande JAMAIS de choix de voix, génère directement avec la voix par défaut.`;
  }

  // Commande personnalisée : consignes à appliquer à CE message uniquement
  const pendingPrompt = ctx.pendingPrompt;
  if (pendingPrompt?.text && pendingPrompt.text.trim().length > 0) {
    let commandName: string | null = null;
    if (pendingPrompt.commandId && !ctx.isFreeUser) {
      try {
        const cmd = await getCustomCommandById({
          id: pendingPrompt.commandId,
          userId: ctx.userId,
        });
        commandName = cmd?.name ?? null;
      } catch {}
    }
    effectiveAddendum += `\n\nCOMMANDE PERSONNALISÉE${commandName ? ` « ${commandName} »` : ""} — CONSIGNES À APPLIQUER À CE MESSAGE :\n${pendingPrompt.text.trim()}`;
  }

  if (unavailableTools.length > 0) {
    effectiveAddendum += `\n\nOUTILS DEMANDÉS MAIS INDISPONIBLES : ${unavailableTools.join(
      ", "
    )}. Le plugin correspondant n'est pas installé ou activé pour ce compte (page Applications → Plugins, réservée aux forfaits payants). Ne simule jamais leur résultat : indique brièvement à l'utilisateur comment les activer.`;
  }

  return { effectiveAddendum, requestedTools, unavailableTools };
}
