export type FormQuestionType =
  | "text"
  | "single_choice"
  | "multi_choice"
  | "rating";

export type FormQuestion = {
  id: string;
  title: string;
  description?: string;
  type: FormQuestionType;
  options?: string[];
  required?: boolean;
};

export const REWARD_TYPES = ["mai", "api", "images", "audio"] as const;
export type RewardType = (typeof REWARD_TYPES)[number];

export const REWARD_LABELS: Record<
  RewardType,
  { title: string; description: string; icon: string }
> = {
  api: {
    description:
      "Remet à zéro le compteur de requêtes des clés API du compte pour la période.",
    icon: "key",
    title: "Clés API (Requêtes)",
  },
  audio: {
    description:
      "Remet à zéro la consommation hebdomadaire de tokens de synthèse vocale.",
    icon: "mic",
    title: "Audio & Speech",
  },
  images: {
    description:
      "Remet à zéro le nombre d'images générées aujourd'hui (quota journalier restauré).",
    icon: "image",
    title: "Génération d'Images",
  },
  mai: {
    description:
      "Remet à zéro la consommation hebdomadaire de tokens pour le chat mAI.",
    icon: "message-square",
    title: "Chat mAI (Tokens)",
  },
};

export type UserFormDetail = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string | null;
  questions: FormQuestion[];
  options: Record<string, unknown>;
  isActive: boolean;
  hasSubmitted: boolean;
  submittedReward?: RewardType | null;
  submittedAt?: string | null;
};
