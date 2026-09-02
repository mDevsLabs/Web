// Presets partagés agents / skills / commandes personnalisées.
// Chaque icône doit avoir une entrée correspondante dans ICON_MAP
// (components/agents/agent-icon.tsx) pour être rendue.

export type AgentIconPreset = { id: string; label: string };

export const AGENT_ICONS: AgentIconPreset[] = [
  { id: "sparkles", label: "Étincelles" },
  { id: "bot", label: "Robot" },
  { id: "code", label: "Code" },
  { id: "book", label: "Livre" },
  { id: "target", label: "Cible" },
  { id: "lightbulb", label: "Idée" },
  { id: "globe", label: "Web" },
  { id: "zap", label: "Rapide" },
  { id: "database", label: "Données" },
  { id: "wallet", label: "Wallet" },
  { id: "palette", label: "Créatif" },
  { id: "heart", label: "Soutien" },
  { id: "shield", label: "Sécurité" },
  { id: "camera", label: "Photo" },
  { id: "music", label: "Musique" },
  { id: "rocket", label: "Lancement" },
  { id: "graduation-cap", label: "Éducation" },
  { id: "chart", label: "Statistiques" },
  { id: "message-circle", label: "Communication" },
  { id: "cloud", label: "Cloud" },
];

export const AGENT_COLORS: string[] = [
  "#6366f1",
  "#06b6d4",
  "#10b981",
  "#a855f7",
  "#f43f5e",
  "#f59e0b",
  "#14b8a6",
  "#f97316",
  "#eab308",
  "#ec4899",
  "#8b5cf6",
  "#0ea5e9",
  "#64748b",
  "#22c55e",
  "#ef4444",
  "#d946ef",
];

export const DEFAULT_AGENT_COLOR = "#6366f1";
