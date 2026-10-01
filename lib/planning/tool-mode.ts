// Périmètre d'outils d'une exécution planifiée.
//
// La planification n'a longtemps proposé qu'une liste d'outils unitaires
// (case par case) alors que l'exécuteur n'en connaît qu'un petit nombre
// (calculator, codeExecution, dateTime, webSearch) plus les outils de plugins,
// de serveurs MCP et de skills. Le granularity unitaire était donc trompeur :
// cocher « Générer image » n'avait aucun effet. On expose désormais trois
// modes qui décrivent exactement ce que l'exécution peut appeler.

export const SCHEDULE_TOOL_MODES = ["auto", "plugins", "none"] as const;
export type ScheduleToolMode = (typeof SCHEDULE_TOOL_MODES)[number];

export const DEFAULT_SCHEDULE_TOOL_MODE: ScheduleToolMode = "auto";

export type ScheduleToolModeMeta = {
  description: string;
  label: string;
  /** Nom de l'icône lucide. */
  icon: "Blocks" | "CircleSlash" | "WandSparkles";
};

export const SCHEDULE_TOOL_MODE_META: Record<
  ScheduleToolMode,
  ScheduleToolModeMeta
> = {
  auto: {
    description:
      "Tous les outils sont disponibles (natifs, plugins, serveurs MCP et skills) : la tâche choisit ce dont elle a besoin.",
    icon: "WandSparkles",
    label: "Automatique",
  },
  none: {
    description:
      "Aucun outil : la réponse repose uniquement sur le modèle et les instructions.",
    icon: "CircleSlash",
    label: "Aucun",
  },
  plugins: {
    description:
      "Seuls les outils des plugins, des serveurs MCP et des skills sont activés (pas d'outils natifs).",
    icon: "Blocks",
    label: "Plugins / MCP et Skills",
  },
};

export function isScheduleToolMode(value: unknown): value is ScheduleToolMode {
  return (
    typeof value === "string" &&
    (SCHEDULE_TOOL_MODES as readonly string[]).includes(value)
  );
}

/** Normalise une valeur entrante (API, base, ancien `enabledTools`). */
export function normalizeScheduleToolMode(value: unknown): ScheduleToolMode {
  return isScheduleToolMode(value) ? value : DEFAULT_SCHEDULE_TOOL_MODE;
}

/**
 * Détermine le mode d'une tâche planifiée.
 *
 * Les tâches créées avant la migration 0029 n'ont pas de `toolMode` : on
 * déduit alors le mode de l'ancienne liste d'outils — une sélection vide
 * signifiait « aucun outil », sinon la tâche avait accès à des outils.
 */
export function deriveScheduleToolMode(params: {
  enabledTools?: unknown;
  storedMode?: unknown;
}): ScheduleToolMode {
  if (isScheduleToolMode(params.storedMode)) {
    return params.storedMode;
  }
  const legacy = Array.isArray(params.enabledTools) ? params.enabledTools : [];
  return legacy.length === 0 ? "none" : "auto";
}
