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
  standard: {
    id: "standard",
    label: "Standard",
    shortLabel: "Standard",
    description: "Équilibré pour tous les usages quotidiens.",
    longDescription:
      "Mode équilibré et polyvalent. Réponses claires, directes et utiles pour la plupart des tâches.",
    icon: ScaleIcon,
    systemPromptAddendum: "",
    temperature: 0.7,
  },
  creative: {
    id: "creative",
    label: "Créatif",
    shortLabel: "Créatif",
    description: "Imaginatif, idéal pour la rédaction et le brainstorming.",
    longDescription:
      "Privilégie l'originalité et la diversité des idées. Parfait pour écrire, inventer des histoires, trouver des noms ou explorer des concepts.",
    icon: SparklesIcon,
    systemPromptAddendum:
      "Tu es en mode Créatif : privilégie l'originalité, les métaphores et les idées variées. Propose plusieurs variantes quand c'est pertinent.",
    temperature: 0.95,
    topP: 0.95,
  },
  precise: {
    id: "precise",
    label: "Précis",
    shortLabel: "Précis",
    description: "Factuel, structuré et concis.",
    longDescription:
      "Réponses structurées, sourcées par la logique, avec un minimum de fioritures. Idéal pour synthèses et analyses.",
    icon: TargetIcon,
    systemPromptAddendum:
      "Tu es en mode Précis : sois factuel, structuré et concis. Utilise des listes et des sections. Évite les répétitions et les digressions.",
    temperature: 0.3,
    topP: 0.9,
  },
  code: {
    id: "code",
    label: "Code & Dev",
    shortLabel: "Code",
    description: "Optimisé pour la programmation et le debug.",
    longDescription:
      "Priorité au code propre, commenté et exécutable. Utilise les artifacts de code quand tu dois produire un script ou une fonctionnalité.",
    icon: Code2Icon,
    systemPromptAddendum:
      "Tu es en mode Code & Développement : fournis du code propre, typé et commenté. Privilégie les exemples exécutables et explique les choix techniques. Utilise createDocument(updateDocument/editDocument) pour les livrables de code.",
    temperature: 0.4,
  },
  reasoning: {
    id: "reasoning",
    label: "Raisonnement",
    shortLabel: "Raisonnement",
    description: "Raisonnement étape par étape, approfondi.",
    longDescription:
      "Prend le temps de raisonner étape par étape avant de répondre. Idéal pour mathématiques, logique et problèmes complexes.",
    icon: BrainIcon,
    systemPromptAddendum:
      "Tu es en mode Raisonnement : réfléchis étape par étape, expose ton raisonnement de manière structurée avant la conclusion. Vérifie tes hypothèses et propose des vérifications.",
    temperature: 0.6,
  },
};

export const DEFAULT_AI_MODE: AIModeId = "standard";

export const AI_MODE_IDS = Object.keys(AI_MODES) as AIModeId[];

export function isValidAIModeId(id: string): id is AIModeId {
  return id in AI_MODES;
}

export function getAIMode(id: string | null | undefined): AIMode {
  if (id && isValidAIModeId(id)) return AI_MODES[id];
  return AI_MODES[DEFAULT_AI_MODE];
}

export function getAIModeCookieName() {
  return "ai-mode";
}

export function getAIExtraPrompt(modeId: AIModeId): string {
  return AI_MODES[modeId]?.systemPromptAddendum || "";
}
