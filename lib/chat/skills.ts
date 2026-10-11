import {
  type SkillParameterDefinition,
  substituteSkillParams,
  validateSkillParams,
  withSkillDefaults,
} from "@/lib/ai/skill-params";
import { getSkillById, trackSkillUsage } from "@/lib/db/queries";

/**
 * ============================================================================
 * Préparation des Skills — fonction NEUTRE
 * ============================================================================
 *
 * POURQUOI CE MODULE EXISTE
 *
 * La préparation d'un Skill (propriété → validation des paramètres → défauts →
 * substitution `{{nom}}` → outils déclarés → serveurs MCP associés) était écrite
 * À LA MAIN dans `lib/chat/context.ts`, à l'intérieur d'une fonction qui lit et
 * écrit les tables `Chat` et `Message`. Il n'existait donc aucun moyen de
 * réutiliser ce raisonnement ailleurs — et le dépôt en avait recopié une
 * version dégradée à deux endroits (la planification, qui n'appliquait pas la
 * substitution des paramètres ; le planificateur d'Agent, qui ne gardait que
 * les instructions).
 *
 * CE QUE LA FONCTION NE FAIT PAS
 *
 * Elle ne lève aucune erreur de transport et ne construit aucun `ChatbotError` :
 * elle renvoie `parameterError` à l'appelant, qui décide de la forme de sa
 * réponse. Une fonction neutre qui répond « 400 du chat » ne le serait plus.
 *
 * LE MULTI-SKILL
 *
 * Les instructions sont renvoyées dans une LISTE, jamais concaténées. Deux
 * Skills distincts peuvent déclarer `{{langue}}` ou `{{ton}}` avec des valeurs
 * différentes : les fusionner en une chaîne produirait un texte où la
 * substitution a déjà eu lieu deux fois sur la même variable, et le dernier
 * Skill aurait silencieusement gagné. Chaque Skill reste donc une entité
 * distincte jusqu'à ce que l'appelant décide de l'ordre.
 *
 * LES DROITS NE SONT PAS REMONTÉS
 *
 * `isFreeUser` ne garde que `mcpServerIds` et `mcpToolFilter`, exactement
 * comme le faisait le chat. Un Skill n'ajoute aucun droit : il ne fait que
 * restrictionner la surface déjà autorisée.
 */

/**
 * BUDGET DE CONTEXTE DES SKILLS
 *
 * L'injection des Skills n'est pas un droit : c'est une part du prompt
 * système, et dix Skills très longs peuvent y écraser le rôle du Wakie et
 * les mémoires. Deux bornes les contiennent :
 *
 *   - SKILL_MAX_INSTRUCTIONS : un Skill au-delà est exclu de l'injection
 *     (raison « trop volumineux ») — il n'est pas tronqué au milieu d'une
 *     phrase, ce qui produirait une consigne incohérente ;
 *   - SKILL_CONTEXT_BUDGET : plafond TOTAL des instructions injectées. Les
 *     Skills sont évalués épinglés d'abord (choix explicite de l'utilisateur),
 *     puis dans l'ordre de la sélection ; le premier qui dépasserait le
 *     budget est exclu (raison « budget épuisé »), et tous les suivants avec
 *     lui. Rien n'estۜ injecté en silence : chaque exclusion remonte à
 *     l'appelant pour être affichée (issues du tour Wakies).
 */
export const SKILL_CONTEXT_BUDGET = 64_000;
export const SKILL_MAX_INSTRUCTIONS = 8000;

export type SkillBudgetExclusion = {
  /** Raison en français, affichable, pour l'issue du tour. */
  raison: "budget épuisé" | "trop volumineux";
  skillId: string;
  /** Taille des instructions APRÈS substitution, en caractères. */
  taille: number;
};

export type PreparedSkill = {
  /** Identifiant du Skill, ou `null` si la sélection était vide ou inconnue. */
  skillId: string | null;
  /** Nom du Skill, tel qu'enregistré (affichage des exclusions). */
  name: string;
  /** Instructions APRÈS substitution des paramètres. */
  instructions: string;
  /** Le Skill est-il épinglé dans la bibliothèque du compte ? */
  pinned: boolean;
  /** Identifiants d'outils déclarés par le Skill. */
  tools: string[];
  /** Serveurs MCP déclarés, ignorés pour un compte gratuit. */
  mcpServerIds: string[];
  /** Filtre d'outils MCP par serveur, ignoré pour un compte gratuit. */
  mcpToolFilter: Record<string, string[] | null> | null;
};

export type PreparedSkills = {
  /** Instructions INJECTÉES, épinglés d'abord puis ordre de sélection. */
  instructions: string[];
  /** Identifiants injectés (dans le même ordre que `instructions`). */
  injectedSkillIds: string[];
  /** Total des caractères injectés (contrôle et diagnostics). */
  injectedCharacterCount: number;
  /** Skills demandés, trouvés, mais écartés par le budget de contexte. */
  exclusions: SkillBudgetExclusion[];
  /** Union des outils déclarés, sans doublon. */
  tools: string[];
  /** Union des serveurs MCP déclarés. */
  mcpServerIds: string[];
  /**
   * Filtre d'outils MCP par serveur. Les filtres de plusieurs Skills sont
   * RÉUNIS par intersection, jamais écrasés : un filtre vide est une
   * liste blanche vide (fail-closed), donc l'intersection de deux Skill
   * ne peut pas élargir ce que l'un des deux refusait.
   */
  mcpToolFilter: Record<string, string[] | null> | null;
  /**
   * Message d'erreur en français si un paramètre est manquant ou hors bornes.
   * L'appelant le transforme en refus HTTP, ou l'ignore — jamais de throw ici.
   */
  parameterError: string | null;
  /** Skills trouvés, dans l'ordre. Un identifiant inconnu est simplement absent. */
  skills: PreparedSkill[];
};

const VIDE: PreparedSkills = {
  exclusions: [],
  injectedCharacterCount: 0,
  injectedSkillIds: [],
  instructions: [],
  mcpServerIds: [],
  mcpToolFilter: null,
  parameterError: null,
  skills: [],
  tools: [],
};

/**
 * Réunit les filtres d'outils de plusieurs Skills par intersection.
 *
 * `undefined` = « ce Skill ne filtre pas ce serveur » → le résultat suit les
 * autres. Un tableau vide = liste blanche vide → le résultat est vide.
 * `null` explicite = « aucun outil de ce serveur » → le résultat est `null`.
 */
export function intersecterFiltres(
  filtres: (Record<string, string[] | null> | null | undefined)[]
): Record<string, string[] | null> | null {
  const parServeur = new Map<string, string[] | null>();
  for (const filtre of filtres) {
    if (!filtre) {
      continue;
    }
    for (const [serverId, outils] of Object.entries(filtre)) {
      if (!parServeur.has(serverId)) {
        parServeur.set(serverId, outils);
        continue;
      }
      const dejaVu = parServeur.get(serverId) ?? null;
      if (dejaVu === null || outils === null) {
        // L'un des deux refuse tout : le résultat refuse tout.
        parServeur.set(serverId, null);
        continue;
      }
      parServeur.set(
        serverId,
        dejaVu.filter((outil) => outils.includes(outil))
      );
    }
  }
  return parServeur.size > 0 ? Object.fromEntries(parServeur) : null;
}

/** Prépare UN Skill. Ne lève rien : un identifiant inconnu donne `null`. */
export async function prepareSkillContext(params: {
  userId: string;
  skillId: string | null | undefined;
  skillParams?: Record<string, string> | null;
  isFreeUser: boolean;
}): Promise<
  | (PreparedSkill & { parameterError: string | null })
  | { skillId: null; parameterError: string | null }
> {
  if (!params.skillId) {
    return { parameterError: null, skillId: null };
  }
  try {
    const skill = await getSkillById({
      id: params.skillId,
      userId: params.userId,
    });
    if (!skill) {
      // Un identifiant présenté par le navigateur ne prouve pas que le Skill
      // appartient à ce compte : `getSkillById` est filtré par `userId`.
      return { parameterError: null, skillId: null };
    }
    const parameters = Array.isArray(skill.parameters)
      ? (skill.parameters as SkillParameterDefinition[])
      : [];
    const parameterError = validateSkillParams(parameters, params.skillParams);
    const effectifs = withSkillDefaults(parameters, params.skillParams);
    const instructions = substituteSkillParams(skill.instructions, effectifs);
    // Comptage d'usage : une fois par Skill et par tour, jamais deux fois pour
    // le même Skill même s'il apparaît deux fois dans la sélection.
    trackSkillUsage({ skillId: skill.id, userId: params.userId }).catch(
      () => {}
    );
    return {
      instructions,
      mcpServerIds:
        params.isFreeUser || !Array.isArray(skill.mcpServerIds)
          ? []
          : (skill.mcpServerIds as string[]),
      mcpToolFilter:
        params.isFreeUser ||
        !skill.mcpToolFilter ||
        typeof skill.mcpToolFilter !== "object"
          ? null
          : (skill.mcpToolFilter as Record<string, string[] | null>),
      name: skill.name,
      parameterError,
      pinned: skill.pinned === true,
      skillId: skill.id,
      tools: Array.isArray(skill.tools) ? (skill.tools as string[]) : [],
    };
  } catch {
    // Une base momentanément inaccessible ne doit pas faire échouer tout le
    // tour : le Skill est simplement absent du plateau.
    return { parameterError: null, skillId: null };
  }
}

/**
 * Prépare une sélection de Skills pour une conversation.
 *
 * Ordre d'injection : épinglés d'abord (choix explicite de l'utilisateur),
 * puis l'ordre de la sélection — chaque groupe garde son ordre relatif. Le
 * budget de contexte est ensuite appliqué dans cet ordre : un Skill exclu ne
 * disparaît PAS de `skills` (il existe toujours) ni des outils/MCP déclarés
 * (l'utilisateur les a demandés), seules ses instructions quittent le prompt,
 * avec une trace dans `exclusions`.
 */
export async function prepareSkillsContext(params: {
  userId: string;
  /** Identifiants dans l'ordre choisi par l'utilisateur. */
  skillIds: readonly string[];
  /** Paramètres indexés PAR SKILL — jamais fusionnés. */
  skillParams?: Record<string, Record<string, string>> | null;
  isFreeUser: boolean;
}): Promise<PreparedSkills> {
  if (params.skillIds.length === 0) {
    return { ...VIDE };
  }
  // Un Skill ne doit être compté qu'une fois, même s'il est listé deux fois.
  const uniques = [...new Set(params.skillIds)].filter(Boolean);
  const prepares = await Promise.all(
    uniques.map((skillId) =>
      prepareSkillContext({
        isFreeUser: params.isFreeUser,
        skillId,
        skillParams: params.skillParams?.[skillId],
        userId: params.userId,
      })
    )
  );

  const skills: (PreparedSkill & { skillId: string })[] = [];
  const exclusions: SkillBudgetExclusion[] = [];
  const injectees: string[] = [];
  let budgetRestant = SKILL_CONTEXT_BUDGET;
  const outils = new Set<string>();
  const serveurs = new Set<string>();
  const filtres: (Record<string, string[] | null> | null)[] = [];
  let parameterError: string | null = null;

  for (const prepare of prepares) {
    if (!prepare.skillId) {
      continue;
    }
    if (prepare.parameterError) {
      parameterError ??= prepare.parameterError;
    }
    const poste: PreparedSkill & { skillId: string } = {
      instructions: prepare.instructions,
      mcpServerIds: prepare.mcpServerIds,
      mcpToolFilter: prepare.mcpToolFilter,
      name: prepare.name,
      pinned: prepare.pinned,
      skillId: prepare.skillId,
      tools: prepare.tools,
    };
    skills.push(poste);
    for (const outil of prepare.tools) {
      outils.add(outil);
    }
    for (const serveur of prepare.mcpServerIds) {
      serveurs.add(serveur);
    }
    filtres.push(prepare.mcpToolFilter);
  }

  // Épinglés d'abord, même ordre relatif à l'intérieur de chaque groupe. Le
  // budget est DÉPENSÉ dans cet ordre d'injection, pas dans l'ordre de la
  // sélection brute : épingler un Skill le rend prioritaire pour tenir dans
  // le contexte.
  const ordreInjection = [...skills].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned)
  );
  const instructionsInjectees: string[] = [];
  let injecteCaracteres = 0;
  for (const poste of ordreInjection) {
    if (poste.instructions.length > SKILL_MAX_INSTRUCTIONS) {
      // Un Skill très long n'est pas tronqué au milieu : une consigne coupée
      // deviendrait incohérente. Il est exclu avec sa raison, visible.
      exclusions.push({
        raison: "trop volumineux",
        skillId: poste.skillId,
        taille: poste.instructions.length,
      });
      continue;
    }
    if (budgetRestant < poste.instructions.length) {
      // Les suivants sont exclus avec lui : le budget ne se re-remplit pas.
      exclusions.push({
        raison: "budget épuisé",
        skillId: poste.skillId,
        taille: poste.instructions.length,
      });
      continue;
    }
    budgetRestant -= poste.instructions.length;
    injectees.push(poste.skillId);
    injecteCaracteres += poste.instructions.length;
  }

  return {
    exclusions,
    injectedCharacterCount: injecteCaracteres,
    injectedSkillIds: injectees,
    instructions: injectees.length
      ? ordreInjection
          .filter((poste) => injectees.includes(poste.skillId))
          .map((poste) => poste.instructions)
      : [],
    mcpServerIds: [...serveurs],
    mcpToolFilter: intersecterFiltres(filtres),
    parameterError,
    skills,
    tools: [...outils],
  };
}
