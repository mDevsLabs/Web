import {
  BrainIcon,
  Code2Icon,
  ScaleIcon,
  SparklesIcon,
  TargetIcon,
} from "lucide-react";

export type AIModeId =
  | "standard"
  | "creative"
  | "precise"
  | "code"
  | "reasoning";

export type AIMode = {
  id: AIModeId;
  label: string;
  shortLabel: string;
  description: string;
  longDescription: string;
  icon: typeof SparklesIcon;
  systemPromptAddendum: string;
  temperature?: number;
  topP?: number;
  activeTools?: string[] | null;
};

export const AI_MODES: Record<AIModeId, AIMode> = {
  code: {
    description: "Optimisé pour la programmation et le debug.",
    icon: Code2Icon,
    id: "code",
    label: "Code & Dev",
    longDescription:
      "Priorité au code propre, commenté et exécutable. Utilise les artifacts de code quand tu dois produire un script ou une fonctionnalité.",
    shortLabel: "Code",
    systemPromptAddendum:
      "Tu es en mode Code & Développement : fournis du code propre, typé et commenté. Privilégie les exemples exécutables et explique les choix techniques. Utilise createDocument(updateDocument/editDocument) pour les livrables de code.",
    temperature: 0.4,
  },
  creative: {
    description: "Imaginatif, idéal pour la rédaction et le brainstorming.",
    icon: SparklesIcon,
    id: "creative",
    label: "Créatif",
    longDescription:
      "Privilégie l'originalité et la diversité des idées. Parfait pour écrire, inventer des histoires, trouver des noms ou explorer des concepts.",
    shortLabel: "Créatif",
    systemPromptAddendum:
      "Tu es en mode Créatif : privilégie l'originalité, les métaphores et les idées variées. Propose plusieurs variantes quand c'est pertinent.",
    temperature: 0.95,
    topP: 0.95,
  },
  precise: {
    description: "Factuel, structuré et concis.",
    icon: TargetIcon,
    id: "precise",
    label: "Précis",
    longDescription:
      "Réponses structurées, sourcées par la logique, avec un minimum de fioritures. Idéal pour synthèses et analyses.",
    shortLabel: "Précis",
    systemPromptAddendum:
      "Tu es en mode Précis : sois factuel, structuré et concis. Utilise des listes et des sections. Évite les répétitions et les digressions.",
    temperature: 0.3,
    topP: 0.9,
  },
  reasoning: {
    description: "Raisonnement étape par étape, approfondi.",
    icon: BrainIcon,
    id: "reasoning",
    label: "Raisonnement",
    longDescription:
      "Prend le temps de raisonner étape par étape avant de répondre. Idéal pour mathématiques, logique et problèmes complexes.",
    shortLabel: "Raisonnement",
    systemPromptAddendum:
      "Tu es en mode Raisonnement : réfléchis étape par étape, expose ton raisonnement de manière structurée avant la conclusion. Vérifie tes hypothèses et propose des vérifications.",
    temperature: 0.6,
  },
  standard: {
    description: "Équilibré pour tous les usages quotidiens.",
    icon: ScaleIcon,
    id: "standard",
    label: "Standard",
    longDescription:
      "Mode équilibré et polyvalent. Réponses claires, directes et utiles pour la plupart des tâches.",
    shortLabel: "Standard",
    systemPromptAddendum: "",
    temperature: 0.7,
  },
};

export const DEFAULT_AI_MODE: AIModeId = "standard";

export const AI_MODE_IDS = Object.keys(AI_MODES) as AIModeId[];

export function isValidAIModeId(id: string): id is AIModeId {
  return id in AI_MODES;
}

export function getAIMode(id: string | null | undefined): AIMode {
  if (id && isValidAIModeId(id)) {
    return AI_MODES[id];
  }
  return AI_MODES[DEFAULT_AI_MODE];
}

export function getAIModeCookieName() {
  return "ai-mode";
}

export function getAIExtraPrompt(modeId: AIModeId): string {
  return AI_MODES[modeId]?.systemPromptAddendum || "";
}
