import {
  type ChatModel,
  getModelCapabilities as getBaseModelCapabilities,
} from "@/lib/ai/models";
import {
  isReasoningLevel,
  REASONING_LEVELS,
  type ReasoningLevel,
} from "@/lib/ai/registry/reasoning";

// Capacités étendues : superset de ModelCapabilities (lib/ai/models) utilisé par
// Agent pour décider quoi afficher dans le composer, quels outils proposer et
// quels fichiers accepter. Les heuristiques historiques de lib/ai/models.ts
// restent le repli de dernier recours, jamais la règle : toute précision
// s'écrit ici, dans les surcharges par identifiant de modèle.
export type ModelCapabilities = {
  audio: boolean;
  contextWindow: number | null;
  documents: boolean;
  file: boolean;
  image: boolean;
  images: boolean;
  maxFiles: number;
  reasoning: boolean;
  // Le modèle peut-il raisonner sans que ce soit activable ? (`mandatory`).
  // Un modèle à réflexion obligatoire n'expose jamais "none" en pratique, et
  // l'interface doit pouvoir l'expliquer plutôt que d'identifier un bug.
  reasoningMandatory: boolean;
  // Niveau retenu par le fournisseur en l'absence de choix explicite.
  reasoningDefault: ReasoningLevel | null;
  // Niveaux RÉELLEMENT acceptés, dans l'ordre du catalogue. Vide = le modèle
  // raisonne mais n'expose aucun niveau (ex. minimax/minimax-m3, alias
  // mAI-2-Mini : `reasoning: { mandatory: false }` sans `supported_efforts`).
  // L'interface masque alors le sélecteur plutôt que d'inventer des niveaux.
  reasoningLevels: ReasoningLevel[];
  tools: boolean;
  vision: boolean;
};

export const DEFAULT_MAX_FILES = 10;

// Compatibilité Agent évaluée modèle par modèle (et adapter par adapter) :
// un simple booléen provider global ne suffit pas — un modèle peut exposer des
// définitions d'outils sans produire de ToolCalls structurés exploitables, ou
// sans pouvoir continuer après un ToolResult. Toute correction s'écrit dans
// MODEL_CAPABILITY_OVERRIDES ou AGENT_COMPATIBILITY_OVERRIDES, jamais dans un
// `if (model === "...")` dispersé.
export type AgentModelCompatibility = {
  // ToolResults acceptés après un appel (format de sortie exploitable).
  continuationAfterToolResult: boolean;
  // ToolCalls structurés réellement émis (et non du texte à parser).
  structuredToolCalls: boolean;
  // Définitions d'outils acceptées (tools/functions dans la requête).
  toolDefinitions: boolean;
};

export const DEFAULT_AGENT_COMPATIBILITY: AgentModelCompatibility = {
  continuationAfterToolResult: true,
  structuredToolCalls: true,
  toolDefinitions: true,
};

export const AGENT_COMPATIBILITY_OVERRIDES: Record<
  string,
  Partial<AgentModelCompatibility>
> = {};

export function agentCompatibilityFor(
  modelId: string,
  baseTools: boolean
): AgentModelCompatibility {
  if (!baseTools) {
    return {
      continuationAfterToolResult: false,
      structuredToolCalls: false,
      toolDefinitions: false,
    };
  }
  return {
    ...DEFAULT_AGENT_COMPATIBILITY,
    ...AGENT_COMPATIBILITY_OVERRIDES[modelId],
  };
}

// Surcharges explicites, par identifiant de modèle. Seule source autorisée pour
// corriger une capacité : aucun composant ne doit écrire `if (model === "...")`.
export const MODEL_CAPABILITY_OVERRIDES: Record<
  string,
  Partial<ModelCapabilities>
> = {};

function readInputModalities(model: ChatModel | string): string[] {
  if (typeof model === "string") {
    return [];
  }
  return model.architecture?.input_modalities ?? [];
}

function readReasoningField(
  model: ChatModel | string,
  field: "default_effort" | "mandatory"
): unknown {
  return typeof model === "string" ? undefined : model.reasoning?.[field];
}

function readReasoningMandatory(model: ChatModel | string): boolean {
  return readReasoningField(model, "mandatory") === true;
}

function readReasoningDefault(
  model: ChatModel | string
): ReasoningLevel | null {
  const value = readReasoningField(model, "default_effort");
  return isReasoningLevel(value) ? value : null;
}

// Les niveaux sont lus depuis le catalogue, jamais définis ici. On conserve
// l'ordre déclaré par le fournisseur (souvent décroissant) et on retire ce que
// le vocabulaire partagé ne connaît pas, plutôt que d'inverser le tri : un
// fournisseur qui ajoute un niveau intermédiaire doit apparaître sans qu'on
// touche au code.
function readReasoningLevels(model: ChatModel | string): ReasoningLevel[] {
  if (typeof model === "string") {
    return [];
  }
  const declared = model.reasoning?.supported_efforts;
  if (!Array.isArray(declared)) {
    return [];
  }
  const seen = new Set<ReasoningLevel>();
  for (const value of declared) {
    if (isReasoningLevel(value)) {
      seen.add(value);
    }
  }
  return REASONING_LEVELS.filter((level) => seen.has(level));
}

export function deriveModelCapabilities(
  model: ChatModel | string
): ModelCapabilities {
  const base = getBaseModelCapabilities(model);
  const modelId = typeof model === "string" ? model : model.id;
  const inputModalities = readInputModalities(model);
  const contextWindow =
    typeof model === "string" ? null : (model.maxContext ?? null);

  const supportsFiles = base.file || base.image;

  const derived: ModelCapabilities = {
    audio:
      inputModalities.includes("audio") || inputModalities.includes("speech"),
    contextWindow,
    documents: base.file,
    file: base.file,
    image: base.image,
    images: base.image,
    maxFiles: supportsFiles ? DEFAULT_MAX_FILES : 0,
    reasoning: base.reasoning,
    // Niveaux et niveau par défaut lus depuis le catalogue. Un modèle qui
    // raisonne sans exposer `supported_efforts` n'a pas de sélecteur à proposer
    // : on laisse la liste vide plutôt que d'en inventer une.
    reasoningDefault: readReasoningDefault(model),
    reasoningLevels: readReasoningLevels(model),
    reasoningMandatory: readReasoningMandatory(model),
    tools: base.tools,
    vision: base.vision,
  };

  return { ...derived, ...MODEL_CAPABILITY_OVERRIDES[modelId] };
}

// Les modèles du catalogue évoluent rarement : mémoïsation par identifiant pour
// éviter de recalculer les heuristiques à chaque rendu ou appel serveur.
const capabilitiesCache = new Map<string, ModelCapabilities>();

export function getMemoizedCapabilities(
  model: ChatModel | string
): ModelCapabilities {
  const modelId = typeof model === "string" ? model : model.id;
  // Les métadonnées OpenRouter évoluent sans changer l'identifiant. Inclure leur
  // signature dans la clé évite de conserver les capacités d'un ancien snapshot
  // du catalogue pendant toute la vie du processus. `reasoning` en fait partie
  // depuis la v3 : sans lui, un modèle qui gagne (ou perd) des niveaux d'effort
  // garderait ses anciennes capacités jusqu'au redémarrage du process.
  const metadataKey =
    typeof model === "string"
      ? ""
      : JSON.stringify({
          architecture: model.architecture,
          maxContext: model.maxContext,
          reasoning: model.reasoning,
          supported_parameters: model.supported_parameters,
        });
  const cacheKey = `v3:${modelId}:${metadataKey}`;
  const cached = capabilitiesCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const computed = deriveModelCapabilities(model);
  capabilitiesCache.set(cacheKey, computed);
  return computed;
}

export function resetCapabilitiesCache(): void {
  capabilitiesCache.clear();
}

export type ReasoningEffortResolution = {
  /** Niveau réellement transmis au modèle, ou `null` si le choix n'a pas d'effet. */
  effort: ReasoningLevel | null;
  /** La préférence a-t-elle pu être honorée telle quelle ? */
  exact: boolean;
  /**
   * Raison du recadrage, pour l'interface : « Le modèle sélectionné ne propose
   * pas ce niveau » ne s'applique pas de la même façon que « ce modèle ne
   * propose aucun niveau ».
   */
  reason: "exact" | "no_levels" | "not_supported" | "capability_unknown";
};

/**
 * Recale une préférence d'effort sur ce que le modèle sait réellement faire.
 *
 * L'utilisateur ne choisit pas un niveau « en général » : il choisit une
 * préférence, et le modèle sélectionné décide. `space-bunny-alpha` accepte
 * max/xhigh/high/medium/low alors que `mai-2` se limite à max/high/low — la
 * même préférence doit donc produire une requête différente selon le modèle.
 *
 * Ordre de repli : préférence si acceptée, sinon le `default_effort` du
 * fournisseur, sinon le niveau le plus proche *en dessous* (jamais au-dessus :
 * on ne veut pas élever la facture de l'utilisateur), sinon le premier proposé.
 */
export function resolveReasoningEffort(params: {
  capabilities: Pick<
    ModelCapabilities,
    "reasoning" | "reasoningDefault" | "reasoningLevels"
  >;
  preferred: unknown;
}): ReasoningEffortResolution {
  const { capabilities, preferred } = params;
  const available = capabilities.reasoningLevels;

  // Modèle qui ne raisonne pas du tout : aucun réglage n'a de sens.
  if (!capabilities.reasoning) {
    return { effort: null, exact: false, reason: "capability_unknown" };
  }
  // Le modèle raisonne mais n'expose aucun niveau (mAI-2-Mini, par exemple) :
  // on laisse le fournisseur trancher plutôt que d'inventer un niveau.
  if (available.length === 0) {
    return { effort: null, exact: false, reason: "no_levels" };
  }
  if (isReasoningLevel(preferred) && available.includes(preferred)) {
    return { effort: preferred, exact: true, reason: "exact" };
  }

  if (
    capabilities.reasoningDefault &&
    available.includes(capabilities.reasoningDefault)
  ) {
    return {
      effort: capabilities.reasoningDefault,
      exact: false,
      reason: "not_supported",
    };
  }

  // Plus proche niveau inférieur dans l'ordre canonique (max → none).
  if (isReasoningLevel(preferred)) {
    const wantedIndex = REASONING_LEVELS.indexOf(preferred);
    for (
      let index = wantedIndex + 1;
      index < REASONING_LEVELS.length;
      index++
    ) {
      const candidate = REASONING_LEVELS[index];
      if (available.includes(candidate)) {
        return { effort: candidate, exact: false, reason: "not_supported" };
      }
    }
  }

  // Rien en dessous et pas de défaut fournisseur : on prend le niveau le MOINS
  // intense, jamais le premier de la liste. La liste est ordonnée du plus cher
  // au moins cher, donc `available[0]` vaudrait « max » — demander depuis
  // « minimal » tomberait sur la facture la plus élevée de tout le jeu.
  return {
    effort: available.at(-1) ?? null,
    exact: false,
    reason: "not_supported",
  };
}
