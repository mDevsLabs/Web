/**
 * Présentation visuelle des projets mAI.
 *
 * Les données (nom, description, plateformes, dépôt) vivent dans
 * `lib/projects-data.ts`. Ce module ne contient que la couche purement visuelle —
 * icône Lucide, teinte et survol de la bordure — afin que la page /projects et la
 * vitrine de la page d'accueil ne puissent plus diverger sur ces choix.
 */

import { ArchiveIcon as Archive, Code2Icon as Code2, CpuIcon as Cpu, GlobeIcon as Globe, MessagesSquareIcon as MessagesSquare, TerminalIcon as Terminal } from "@mdevs/icons";
import type { IconProps } from "@mdevs/icons";

export type ProjectPresentation = {
  icon: React.ComponentType<any>;
  iconColor: string;
  borderHover: string;
};

/** Repli appliqué à tout projet dépourvu de présentation propre. */
const FALLBACK_PRESENTATION: ProjectPresentation = {
  borderHover: "hover:border-slate-300/30",
  icon: Archive,
  iconColor: "text-slate-600",
};

const PROJECT_PRESENTATIONS: Record<string, ProjectPresentation> = {
  cli: {
    borderHover:
      "hover:border-blue-500/30 hover:shadow-[0_8px_32px_0_rgba(59,130,246,0.15)]",
    icon: Terminal,
    iconColor: "text-purple-400",
  },
  coder: {
    borderHover:
      "hover:border-emerald-500/30 hover:shadow-[0_8px_32px_0_rgba(160,185,129,0.15)]",
    icon: Code2,
    iconColor: "text-purple-400",
  },
  pulse: {
    borderHover:
      "hover:border-emerald-500/30 hover:shadow-[0_8px_32px_0_rgba(160,185,129,0.15)]",
    icon: Cpu,
    iconColor: "text-emerald-400",
  },
  vibe: {
    borderHover:
      "hover:border-purple-500/30 hover:shadow-[0_8px_32px_0_rgba(168,85,247,0.15)]",
    icon: MessagesSquare,
    iconColor: "text-purple-400",
  },
  web: {
    borderHover:
      "hover:border-emerald-500/30 hover:shadow-[0_8px_32px_0_rgba(160,185,129,0.15)]",
    icon: Globe,
    iconColor: "text-amber-400",
  },
};

/**
 * `iconKey` est la clé déclarée dans `lib/projects-data.ts`. Elle sert de source de
 * vérité : si les deux tables se contredisent, l'icône suit toujours `iconKey`.
 */
const ICONS_BY_KEY: Record<string, React.ComponentType<any>> = {
  code: Code2,
  cpu: Cpu,
  globe: Globe,
  "messages-square": MessagesSquare,
  terminal: Terminal,
};

export function getProjectPresentation(project: {
  id: string;
  iconKey?: string;
}): ProjectPresentation {
  const presentation =
    PROJECT_PRESENTATIONS[project.id] ?? FALLBACK_PRESENTATION;
  const iconFromKey = project.iconKey
    ? ICONS_BY_KEY[project.iconKey]
    : undefined;

  return iconFromKey ? { ...presentation, icon: iconFromKey } : presentation;
}
