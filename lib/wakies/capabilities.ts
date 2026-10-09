import "server-only";

/**
 * ============================================================================
 * Capacités d'un tour Wakies — résolution et revalidation
 * ============================================================================
 *
 * LE PRINCIPE
 *
 * Un identifiant de Skill, de Plugin ou de serveur MCP enregistré dans les
 * colonnes d'un Wakie n'est PAS une autorisation. Il ne prouve que ce que
 * l'utilisateur a choisi un jour. Ce module est le point où ce choix est
 * REVALIDÉ contre l'état réel du compte, à chaque tour, avant qu'un seul outil
 * ne soit instancié.
 *
 * Les quatre questions, dans cet ordre :
 *
 *   1. Le Skill existe-t-il, et appartient-il à CE compte ?
 *   2. Le Plugin est-il installé, activé, et accessible au forfait ?
 *   3. Le serveur MCP est-il activé, et le kill-switch	global le permet-il ?
 *   4. L'outil demandé est-il réellement un outil connu ?
 *
 * CE QUI N'EST JAMAIS FAIT
 *
 *   - une sélection invalide n'est jamais complétée par « tous les outils du
 *     compte ». Si un identifiant est inconnu, il est SIGNALE et retiré.
 *   - une installation désactivée n'est jamais présentée comme utilisable : la
 *     disponibilité est recalculée, pas lue dans la fiche du Wakie.
 *   - un Plugin déclarant `writesUserData` ou `requiresApproval` n'est jamais
 *     instancié dans le canal chat : `createPluginTools` lève une exception dans
 *     ce cas, et on ne veut pas l discovers à la première requête. Il est
 *     écarté ici, avec sa raison.
 */

import { normalizeToolIds } from "@/lib/ai/tools/ids";
import { isPaidTier } from "@/lib/auth/plan";
import { prepareSkillsContext } from "@/lib/chat/skills";
import {
  getMcpServersByUserId,
  getPluginInstallationsByUserId,
} from "@/lib/db/queries";
import { getPluginByToolId, getPluginManifest } from "@/lib/plugins/catalog";
import { getToolIdsForPluginIds } from "@/lib/plugins/server";
import { canUsePlugin, pluginTierMessage } from "@/lib/plugins/tier-lock";

/** Raison pour laquelle une capacité demandée n'est pas utilisable. */
export type CapacityIssue = {
  /** Famille de la capacité : `skill`, `plugin`, `mcp` ou `outil`. */
  kind: "skill" | "plugin" | "mcp" | "outil";
  /** Identifiant demandé, tel que l'utilisateur l'a choisi. */
  id: string;
  /** Explication en français, affichable telle quelle. */
  raison: string;
};

export type EffectiveSelection = {
  /** Skills prêts à être injectés, via `prepareSkillsContext`. */
  skills: Awaited<ReturnType<typeof prepareSkillsContext>>;
  /** Plugins réellement utilisables, dans l'ordre choisi. */
  pluginIds: string[];
  /** Serveurs MCP réellement activés, dans l'ordre choisi. */
  mcpServerIds: string[];
  /** Outils `lib/ai/tools` connus, dans l'ordre choisi. */
  toolIds: string[];
  /** Ce qui a été demandé mais n'est pas utilisable, et pourquoi. */
  issues: CapacityIssue[];
};

/** Outils qui écrivent le compte mAI : leur activation est un geste explicite. */
export const OUTILS_ECRIVANT_COMPTE = [
  "updateAccountProfile",
  "updateProfilePicture",
  "memory",
] as const;

/** Outils livrés par un Plugin : jamais exposés si le Plugin ne l'est pas. */
const FOURNIS_PAR_PLUGIN = new Set(["getWeather", "quizzly"]);

/**
 * Outils livrés par défaut à un Wakie.
 *
 * `webSearch` est conditionné par `researchAllowed` : c'est le sens de la case
 * « Recherche sur les pages publiques » du profil. Les deux autres ne
 * coûtent rien au compte et n'agissent sur rien.
 */
export const OUTILS_PAR_DEFAUT = [
  "webSearch",
  "calculator",
  "dateTime",
] as const;

/**
 * Résolution complète de la sélection effective d'un tour.
 *
 * `conversation` et `wakie` portent la même forme de sélection ; c'est la
 * conversation qui l'emporte quand elle a Speaké. Le reste est de la
 * revalidation.
 */
export async function resolveSelection(params: {
  userId: string;
  tier: string;
  isGhostMode: boolean;
  wakie: {
    mcpServerIds?: string[] | null;
    pluginIds?: string[] | null;
    researchAllowed: boolean;
    skillIds?: string[] | null;
    skillParams?: Record<string, Record<string, string>> | null;
    toolIds?: string[] | null;
  };
  conversation: {
    mcpServerIds?: string[] | null;
    pluginIds?: string[] | null;
    skillIds?: string[] | null;
    skillParams?: Record<string, Record<string, string>> | null;
    toolIds?: string[] | null;
  };
}): Promise<EffectiveSelection> {
  const issues: CapacityIssue[] = [];

  // ─── Skills ────────────────────────────────────────────────────────────────
  const skills = await prepareSkillsContext({
    isFreeUser: !isPaidTier(params.tier),
    skillIds: params.conversation.skillIds ?? params.wakie.skillIds ?? [],
    skillParams:
      params.conversation.skillParams ?? params.wakie.skillParams ?? null,
    userId: params.userId,
  });
  if (skills.parameterError) {
    issues.push({
      id: params.conversation.skillIds?.join(", ") ?? "",
      kind: "skill",
      raison: skills.parameterError,
    });
  }
  // Un identifiant de Skill que `getSkillById` n'a pas rendu n'est pas dans
  // `skills.skills` : il n'existe pas pour ce compte.
  const trouves = new Set(skills.skills.map((skill) => skill.skillId));
  for (const demande of [
    ...new Set(params.conversation.skillIds ?? params.wakie.skillIds ?? []),
  ]) {
    if (!trouves.has(demande)) {
      issues.push({
        id: demande,
        kind: "skill",
        raison:
          "Cette compétence n'existe pas ou n'appartient pas à ce compte.",
      });
    }
  }

  // ─── Plugins ───────────────────────────────────────────────────────────────
  const demandesPlugin =
    params.conversation.pluginIds ?? params.wakie.pluginIds ?? [];
  const pluginIds: string[] = [];
  if (demandesPlugin.length > 0) {
    const installations = await getPluginInstallationsByUserId({
      userId: params.userId,
    });
    for (const demande of demandesPlugin) {
      const manifest = getPluginManifest(demande);
      if (!manifest) {
        issues.push({
          id: demande,
          kind: "plugin",
          raison: "Cette extension n'existe pas dans le catalogue.",
        });
        continue;
      }
      if (!canUsePlugin(manifest, params.tier)) {
        issues.push({
          id: demande,
          kind: "plugin",
          raison: pluginTierMessage(manifest),
        });
        continue;
      }
      const installation = installations.find(
        (item) => item.pluginId === demande
      );
      if (!installation) {
        issues.push({
          id: demande,
          kind: "plugin",
          raison: "Cette extension n'est pas installée sur ce compte.",
        });
        continue;
      }
      if (!installation.isEnabled) {
        issues.push({
          id: demande,
          kind: "plugin",
          raison: "Cette extension est désactivée dans vos réglages.",
        });
        continue;
      }
      // Le canal chat ne peut pas posséder un Plugin qui lit ou écrit les
      // données du compte : `createPluginTools` lève dans ce cas. On l'écarte
      // ici avec une raison, plutôt que de laisser une exception au milieu d'un
      // tour déjà commencé.
      if (
        manifest.permissions.writesUserData ||
        manifest.permissions.requiresApproval ||
        manifest.permissions.readsUserData
      ) {
        issues.push({
          id: demande,
          kind: "plugin",
          raison:
            "Cette extension agit sur les données du compte et n'est disponible que depuis l'Agent.",
        });
        continue;
      }
      pluginIds.push(demande);
    }
  }

  // ─── Serveurs MCP ──────────────────────────────────────────────────────────
  // La liste reste EXPLICITE, même vide : `loadMcpContext` distingue `[]`
  // (« aucun serveur », zéro E/S) de `undefined` (« devine à partir des
  // outils demandés »). Un parcours Wakies configuré ne devine jamais.
  const demandesMcp =
    params.conversation.mcpServerIds ?? params.wakie.mcpServerIds ?? [];
  const mcpServerIds: string[] = [];
  if (demandesMcp.length > 0) {
    const serveurs = await getMcpServersByUserId({ userId: params.userId });
    for (const demande of demandesMcp) {
      const serveur = serveurs.find((item) => item.id === demande);
      if (!serveur) {
        issues.push({
          id: demande,
          kind: "mcp",
          raison: "Ce serveur MCP n'existe pas sur ce compte.",
        });
        continue;
      }
      if (!serveur.isEnabled) {
        issues.push({
          id: demande,
          kind: "mcp",
          raison: "Ce serveur MCP est désactivé.",
        });
        continue;
      }
      mcpServerIds.push(demande);
    }
  }

  // ─── Outils ────────────────────────────────────────────────────────────────
  const demandesOutils = params.conversation.toolIds ??
    params.wakie.toolIds ?? [...OUTILS_PAR_DEFAUT];
  const normalises = normalizeToolIds(demandesOutils, {
    pluginToolIds: getToolIdsForPluginIds(pluginIds),
  });
  for (const inconnu of normalises.unknown) {
    issues.push({
      id: inconnu,
      kind: "outil",
      raison: "Cet outil n'existe pas dans le registre.",
    });
  }
  const toolIds: string[] = [];
  for (const outil of normalises.chat) {
    // Un outil livré par un Plugin ne devient disponible que si ce Plugin est
    // dans la sélection RÉSOLUE. Le mentionner dans un Skill ne l'installe pas.
    if (FOURNIS_PAR_PLUGIN.has(outil)) {
      const proprietaire = getPluginByToolId(outil);
      if (!proprietaire || !pluginIds.includes(proprietaire.id)) {
        issues.push({
          id: outil,
          kind: "outil",
          raison:
            "Cet outil dépend d'une extension qui n'est pas sélectionnée.",
        });
        continue;
      }
    }
    // `webSearch` dépend de la permission du Wakie, pas d'une installation.
    if (outil === "webSearch" && !params.wakie.researchAllowed) {
      issues.push({
        id: outil,
        kind: "outil",
        raison:
          "La recherche publique est désactivée pour ce Wakie. Activez-la dans ses réglages.",
      });
      continue;
    }
    if (!toolIds.includes(outil)) {
      toolIds.push(outil);
    }
  }

  return { issues, mcpServerIds, pluginIds, skills, toolIds };
}
