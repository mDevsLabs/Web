// Liste blanche des icônes lucide utilisables dans les manifestes de plugins,
// de modèles MCP et de modèles de Skills. Module neutre (aucun import React) :
// partagé par `lib/plugins/icon.tsx` (client) et par les scripts de validation
// (Node), pour qu'un manifeste ne puisse pas référencer une icône inexistante
// et retomber silencieusement sur une icône de repli.

export const LUCIDE_ICON_NAMES = [
  "Atom",
  "BarChart3",
  "Bot",
  "Braces",
  "Brain",
  "Briefcase",
  "Bug",
  "Calculator",
  "Calendar",
  "Camera",
  "Cloud",
  "CloudSun",
  "Code",
  "Compass",
  "Cpu",
  "Database",
  "FileText",
  "Flame",
  "Gamepad2",
  "Globe",
  "GraduationCap",
  "HeartPulse",
  "Image",
  "Languages",
  "Leaf",
  "Lightbulb",
  "Map",
  "MessageSquare",
  "Mic",
  "Music",
  "Newspaper",
  "Palette",
  "Puzzle",
  "Rocket",
  "Rss",
  "Search",
  "Shield",
  "ShoppingCart",
  "Sparkles",
  "Star",
  "Target",
  "Terminal",
  "TrendingUp",
  "Trophy",
  "Users",
  "Video",
  "Wallet",
  "Wrench",
  "Zap",
] as const;

export type LucideIconName = (typeof LUCIDE_ICON_NAMES)[number];

const LUCIDE_ICON_NAME_SET: ReadonlySet<string> = new Set(LUCIDE_ICON_NAMES);

export function isLucideIconName(name: string): name is LucideIconName {
  return LUCIDE_ICON_NAME_SET.has(name);
}
