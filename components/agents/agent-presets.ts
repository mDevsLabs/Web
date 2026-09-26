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

// Palette de badges : 10 couleurs classiques affichées sur deux lignes de 5,
// plus une couleur libre choisie par l'utilisateur (voir ColorPicker).
// Ces hex sont tous déjà présents dans l'ancienne palette de 16 : aucun agent
// existant ne perd sa couleur.
export const AGENT_COLORS: string[] = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

export const DEFAULT_AGENT_COLOR = "#6366f1";
