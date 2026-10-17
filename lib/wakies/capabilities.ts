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
 *   - un Plugin dont TOUS les outils écrivent chez un fournisseur n'est jamais
 *     instancié dans le canal chat : les écritures relèvent de l'Agent, où le
 *     moteur de permissions les fait approuver avant exécution. Un connecteur
 *     mixte (Google Agenda lit l'agenda et y écrit) reste donc utilisable ici,
 *     pour sa lecture seule ; le router `createPluginTools` filtre les écritures
 *     de son côté, et on écarte ici ce qui ne laisse rien à servir.
 */

import { normalizeToolIds } from "@/lib/ai/tools/ids";
import { isPaidTier } from "@/lib/auth/plan";
import { prepareSkillsContext } from "@/lib/chat/skills";
import {
  getMcpServersByUserId,
  getPluginInstallationsByUserId,
} from "@/lib/db/queries";
import type { PluginInstallation } from "@/lib/db/schema";
import {
  INTEGRATION_PROVIDERS,
  type IntegrationDescriptor,
} from "@/lib/integrations/providers";
import { listActiveConnections } from "@/lib/integrations/repository";
import { getPluginByToolId, getPluginManifest } from "@/lib/plugins/catalog";
import { getToolIdsForPluginIds } from "@/lib/plugins/server";
import { canUsePlugin, pluginTierMessage } from "@/lib/plugins/tier-lock";
import { hasReadTool, toolEffect } from "@/lib/plugins/tool-effect";

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
/**
 * Revalidation d'UNE extension demandée : `null` quand elle est utilisable,
 * sinon la raison française de son refus. Partagée par la sélection du Wakie et
 * par les mentions `@` d'applications connectées, pour que les deux chemins ne
 * puissent jamais se contredire sur ce qu'un plugin a le droit de faire ici.
 */
function raisonDeRefusPlugin(
  demande: string,
  params: {
    installations: readonly PluginInstallation[];
    tier: string;
  }
): string | null {
  const manifest = getPluginManifest(demande);
  if (!manifest) {
    return "Cette extension n'existe pas dans le catalogue.";
  }
  if (!canUsePlugin(manifest, params.tier)) {
    return pluginTierMessage(manifest);
  }
  const installation = params.installations.find(
    (item) => item.pluginId === demande
  );
  if (!installation) {
    return "Cette extension n'est pas installée sur ce compte.";
  }
  if (!installation.isEnabled) {
    return "Cette extension est désactivée dans vos réglages.";
  }
  // Un connecteur mixte (Google Agenda lit ET écrit) reste utilisable ici :
  // `createPluginTools` n'y sert que ses outils de lecture. Un plugin sans
  // AUCUNE lecture n'a rien à servir dans ce canal — l'écriture attend une
  // approbation et ne se déclenche que depuis l'Agent.
  if (!hasReadTool(manifest)) {
    return "Cette extension n'expose que des actions d'écriture : elle n'est disponible que depuis l'Agent.";
  }
  return null;
}

/** Jetons de mention `@` des connecteurs, en minuscules sans espace. */
const MENTIONS_DE_CONNECTEUR: ReadonlyMap<string, IntegrationDescriptor> =
  new Map(
    INTEGRATION_PROVIDERS.flatMap((descriptor) =>
      [descriptor.mentionToken, descriptor.label, descriptor.id].map(
        (cle) =>
          [cle.toLowerCase().replace(/\s+/g, ""), descriptor] as [
            string,
            IntegrationDescriptor,
          ]
      )
    )
  );

/**
 * Applications externes mentionnées par un `@` dans un message Wakies.
 *
 * Le menu `@` de Wakies propose les membres de la conversation ; un connecteur
 * n'est pas un participant, c'est un plateau d'outils qu'on autorise pour ce
 * tour. La demande passe par la MÊME revalidation que la configuration du Wakie
 * (installée, activée, forfait, lecture disponible) et exige en plus une
 * connexion réelle : mentionner Gmail sans compte connecté ne doit pas envoyer
 * un appel à l'API en 401, mais une réponse qui dit quoi faire.
 */
export async function applyIntegrationMentions(params: {
  nomsMentionnes: readonly string[];
  tier: string;
  userId: string;
}): Promise<{ issues: CapacityIssue[]; pluginIds: string[] }> {
  const demandes = params.nomsMentionnes
    .map((nom) => nom.toLowerCase().replace(/\s+/g, ""))
    .filter((nom) => MENTIONS_DE_CONNECTEUR.has(nom));
  if (demandes.length === 0) {
    return { issues: [], pluginIds: [] };
  }

  const [installations, connexions] = await Promise.all([
    getPluginInstallationsByUserId({ userId: params.userId }),
    listActiveConnections({ userId: params.userId }),
  ]);
  const connectes = new Set(connexions.map((ligne) => ligne.provider));

  const issues: CapacityIssue[] = [];
  const pluginIds: string[] = [];
  const dejaVu = new Set<string>();
  for (const nom of demandes) {
    const descriptor = MENTIONS_DE_CONNECTEUR.get(nom);
    if (!descriptor || dejaVu.has(descriptor.pluginId)) {
      continue;
    }
    dejaVu.add(descriptor.pluginId);
    if (!connectes.has(descriptor.id)) {
      issues.push({
        id: descriptor.pluginId,
        kind: "plugin",
        raison: `Connectez ${descriptor.label} depuis l'onglet Plugins pour que je puisse l'utiliser.`,
      });
      continue;
    }
    const refus = raisonDeRefusPlugin(descriptor.pluginId, {
      installations,
      tier: params.tier,
    });
    if (refus) {
      issues.push({ id: descriptor.pluginId, kind: "plugin", raison: refus });
      continue;
    }
    pluginIds.push(descriptor.pluginId);
  }
  return { issues, pluginIds };
}

export async function resolveSelection(params: {
  conversation: {
    mcpServerIds?: string[] | null;
    pluginIds?: string[] | null;
    skillIds?: string[] | null;
    skillParams?: Record<string, Record<string, string>> | null;
    toolIds?: string[] | null;
  };
  isGhostMode: boolean;
  /**
   * Capacité invoquée pour CE tour seulement — mention `@jeton`, et rien
   * d'autre. Elle entre AVANT la revalidation, dans la même voie : une
   * extension non installée, un serveur désactivé ou un plugin hors forfait
   * sont refusés exactement comme s'ils étaient réglés dans la fiche du Wakie.
   * Deux chemins de validation différents finiront toujours par se contredire.
   */
  supplement?: {
    mcpServerIds?: readonly string[];
    pluginIds?: readonly string[];
    skillIds?: readonly string[];
    toolIds?: readonly string[];
  };
  tier: string;
  userId: string;
  wakie: {
    mcpServerIds?: string[] | null;
    pluginIds?: string[] | null;
    researchAllowed: boolean;
    skillIds?: string[] | null;
    skillParams?: Record<string, Record<string, string>> | null;
    toolIds?: string[] | null;
  };
}): Promise<EffectiveSelection> {
  const issues: CapacityIssue[] = [];
  const supplement = params.supplement ?? {};

  /** Sélection de la conversation, sinon du Wakie, PLUS ce que le tour invoque. */
  const union = (
    demande: string[] | null | undefined,
    repli: string[] | null | undefined,
    ajoute: readonly string[] | undefined,
    defaut: readonly string[]
  ): string[] => [
    ...new Set([...(demande ?? repli ?? defaut), ...(ajoute ?? [])]),
  ];

  // ─── Skills ────────────────────────────────────────────────────────────────
  const demandesSkill = union(
    params.conversation.skillIds,
    params.wakie.skillIds,
    supplement.skillIds,
    []
  );
  const skills = await prepareSkillsContext({
    isFreeUser: !isPaidTier(params.tier),
    skillIds: demandesSkill,
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
  for (const demande of demandesSkill) {
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
  const demandesPlugin = union(
    params.conversation.pluginIds,
    params.wakie.pluginIds,
    supplement.pluginIds,
    []
  );
  const pluginIds: string[] = [];
  if (demandesPlugin.length > 0) {
    const installations = await getPluginInstallationsByUserId({
      userId: params.userId,
    });
    for (const demande of demandesPlugin) {
      const refus = raisonDeRefusPlugin(demande, {
        installations,
        tier: params.tier,
      });
      if (refus) {
        issues.push({ id: demande, kind: "plugin", raison: refus });
        continue;
      }
      pluginIds.push(demande);
    }
  }

  // ─── Serveurs MCP ──────────────────────────────────────────────────────────
  // La liste reste EXPLICITE, même vide : `loadMcpContext` distingue `[]`
  // (« aucun serveur », zéro E/S) de `undefined` (« devine à partir des
  // outils demandés »). Un parcours Wakies configuré ne devine jamais.
  const demandesMcp = union(
    params.conversation.mcpServerIds,
    params.wakie.mcpServerIds,
    supplement.mcpServerIds,
    []
  );
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
  const demandesOutils = union(
    params.conversation.toolIds,
    params.wakie.toolIds,
    supplement.toolIds,
    OUTILS_PAR_DEFAUT
  );
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
      // Le plugin est sélectionné, mais CET outil écrit chez le fournisseur :
      // `createPluginTools` ne l'instancie pas hors de l'Agent. Le signaler ici
      // vaut mieux que laisser le modèle appeler un outil absent du plateau.
      const manifestTool = proprietaire.tools.find((item) => item.id === outil);
      if (manifestTool && toolEffect(proprietaire, manifestTool) === "write") {
        issues.push({
          id: outil,
          kind: "outil",
          raison:
            "Cette action écrit chez le fournisseur : elle n'existe que depuis l'Agent, où elle est soumise à votre approbation.",
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
