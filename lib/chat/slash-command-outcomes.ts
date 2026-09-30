import type { SlashCommandAction } from "@/lib/chat/slash-command-catalog";

// Issues des commandes slash, sans effet de bord.
//
// Le mode Agent a toujours affiché les mêmes commandes que le Chat alors que
// vingt d'entre elles ne faisaient rien : le menu annonçait « /notes n'est pas
// pris en charge dans le mode Agent » juste après l'avoir proposé. La cause
// était une liste d'exclusions écrite à la main, forcément en retard sur les
// commandes ajoutées ensuite.
//
// Ici, c'est l'inverse qui est garanti par construction : une commande n'existe
// en mode Agent que si elle produit une issue. `AGENT_SUPPORTED_ACTIONS` est la
// liste de ce qui est implémenté, et l'exclusion se calcule par complément —
// ajouter une action sans issue la masque automatiquement dans le menu Agent.

// Inventaire exhaustif des actions. Toute action ajoutée à l'union
// `SlashCommandAction` doit y figurer : c'est ce qui rend le calcul du
// complément exhaustif plutôt qu'approximatif.
export const ALL_SLASH_COMMAND_ACTIONS = [
  "new",
  "clear",
  "ghost",
  "rename",
  "model",
  "bots",
  "export",
  "theme",
  "delete",
  "purge",
  "usage",
  "library",
  "projects",
  "planning",
  "search",
  "home",
  "tasks",
  "tool-image",
  "tool-audio",
  "tool-web",
  "tool-code",
  "tool-weather",
  "tool-doc",
  "tool-suggest",
  "tool-calc",
  "tool-time",
  "tool-note",
  "tool-chart",
  "tool-memory",
  "tool-qr",
  "tool-summary",
  "quiz",
  "tools-clear",
  "custom",
] as const satisfies readonly SlashCommandAction[];

export type SlashCommandOutcome =
  /** Navigation vers une route de l'application. */
  | { kind: "navigate"; href: string }
  /** Retour à l'accueil avec une conversation vierge. */
  | { kind: "reset" }
  /** Bascule clair / sombre. */
  | { kind: "toggle_theme" }
  /** Ouverture de la recherche globale. */
  | { kind: "open_search" }
  /** Ouverture du sélecteur de modèle présent dans le composer. */
  | { kind: "open_model_selector" }
  /**
   * Ouverture du sélecteur de bots présent dans le composer.
   *
   * Les deux composers montent le MÊME sélecteur sous un `data-testid`
   * différent : le clic se fait donc sur le sélecteur du composer courant, et
   * `/agents` sert de repli quand il est absent (compte Free, sélecteur masqué,
   * run Agent en cours).
   */
  | { kind: "open_bot_selector" }
  /** Export de la conversation courante en Markdown. */
  | { kind: "export_markdown" }
  /** Message informatif : la commande n'agit pas ici mais n'est pas fausse. */
  | { kind: "notice"; message: string }
  /**
   * Aucune issue. Ne doit jamais apparaître dans le menu : la liste d'exclusion
   * du mode Agent est le complément exact de ce qui est traité.
   */
  | { kind: "unsupported" };

/**
 * Actions dont l'issue est implémentée pour les deux modes.
 *
 * Volontairement restreint à ce qui a le même sens partout : navigation,
 * remise à zéro, thème, recherche, sélecteur de modèle, sélecteur de bots,
 * export. Les bascules d'outils one-shot du Chat (`/code`, `/weather`,
 * `/calc`…) restent exclues — l'Agent ne provisionne pas un outil « pour le
 * prochain message », il en choisit lui-même dans sa boucle.
 */
export const AGENT_SUPPORTED_ACTIONS = new Set<SlashCommandAction>([
  "bots",
  "clear",
  "export",
  "home",
  "library",
  "model",
  "new",
  "planning",
  "projects",
  "search",
  "theme",
  "usage",
]);

const NOTICE_MESSAGES: Partial<Record<SlashCommandAction, string>> = {
  rename: "Le renommage est disponible depuis le menu de la discussion.",
};

/** Actions à ne pas proposer en mode Agent : le calcul est son complément. */
export const AGENT_EXCLUDED_SLASH_ACTIONS: ReadonlySet<SlashCommandAction> =
  new Set(
    ALL_SLASH_COMMAND_ACTIONS.filter(
      (action) => !AGENT_SUPPORTED_ACTIONS.has(action)
    )
  );

/**
 * Traduit une commande en effet à exécuter, sans le exécuter.
 *
 * Retourner une intention plutôt qu'un effet permet au Chat et à l'Agent de
 * partager la même décision tout en gardant leurs dépendances propres : le
 * routeur d'un côté, le composer et son reset de l'autre.
 */
export function resolveSlashCommandOutcome(params: {
  action: SlashCommandAction;
  resolvedTheme?: string;
}): SlashCommandOutcome {
  const { action, resolvedTheme } = params;

  switch (action) {
    case "new":
    case "home":
      return { kind: "reset" };
    case "clear":
      return { kind: "reset" };
    case "library":
      return { href: "/library", kind: "navigate" };
    case "projects":
      return { href: "/projects", kind: "navigate" };
    case "planning":
      return { href: "/planning", kind: "navigate" };
    case "usage":
      return { href: "/settings?tab=usage", kind: "navigate" };
    case "theme":
      return { kind: "toggle_theme" };
    case "search":
      return { kind: "open_search" };
    case "model":
      return { kind: "open_model_selector" };
    case "bots":
      return { kind: "open_bot_selector" };
    case "export":
      return { kind: "export_markdown" };
    default: {
      const message = NOTICE_MESSAGES[action];
      // Une action sans issue ne doit jamais être proposée en mode Agent : le
      // menu est filtré par AGENT_EXCLUDED_SLASH_ACTIONS, calculé par
      // complément, et une assertion le vérifie.
      return message ? { kind: "notice", message } : { kind: "unsupported" };
    }
  }
}
