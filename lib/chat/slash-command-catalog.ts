// Catalogue des commandes slash — partie pure, sans React ni icône.
//
// POURQUOI CE FICHIER EXISTE
// Le catalogue vit dans `components/chat/slash-commands.tsx`, un composant
// client dont chaque entrée porte un élément JSX. Deux conséquences :
//
// 1. `lib/chat/slash-command-outcomes.ts` (serveur) ne pouvait importer que le
//    TYPE, via un `import type`. Impossible d'y lire les NOMS réels.
//
// 2. `app/(chat)/api/commands/route.ts` devait donc valider un déclencheur
//    personnalisé sans pouvoir connaître les déclencheurs réservés. Une
//    commande « prompt » nommée `image` ou `clear` était acceptée en base et
//    écrasait l'entrée système dans le menu, silencieusement.
//
// On sépare ici ce qui est de la DONNÉE (les actions possibles, les
// déclencheurs réservés) de ce qui est de l'AFFICHAGE (l'icône). Le composant
// réimporte ce module, et `tests/unit/slash-command-invariants.test.ts`
// échoue si les deux listes cessent de correspondre.

export type SlashCommandAction =
  | "new"
  | "clear"
  | "ghost"
  | "rename"
  | "model"
  | "bots"
  | "export"
  | "theme"
  | "delete"
  | "purge"
  | "usage"
  | "library"
  | "projects"
  | "planning"
  | "search"
  | "home"
  | "tasks"
  | "tool-image"
  | "tool-audio"
  | "tool-web"
  | "tool-code"
  | "tool-weather"
  | "tool-doc"
  | "tool-suggest"
  | "tool-calc"
  | "tool-time"
  | "tool-note"
  | "tool-chart"
  | "tool-memory"
  | "tool-qr"
  | "tool-summary"
  | "quiz"
  | "tools-clear"
  | "custom";

/**
 * Déclencheurs que les commandes système s'approprient : nom + alias.
 *
 * Une commande personnalisée ne peut pas les prendre. Sans cette liste, `/image`
 * créer par un utilisateur et `/image` système coexistent dans le menu, et le
 * premier arrivé gagne — un comportement qui change selon l'ordre du catalogue.
 */
export const BUILT_IN_SLASH_COMMAND_TRIGGERS: readonly string[] = [
  "ghost",
  "fantome",
  "incognito",
  "temporary",
  "temp",
  "new",
  "clear",
  "rename",
  "model",
  "bots",
  "bot",
  "agents",
  "agent",
  "ia-agents",
  "export",
  "exporter",
  "download",
  "telecharger",
  "usage",
  "library",
  "stockage",
  "projects",
  "search",
  "recherche",
  "find",
  "taches",
  "plan",
  "todo",
  "image",
  "images",
  "generate",
  "audio",
  "son",
  "voice",
  "speech",
  "tts",
  "voix",
  "web",
  "recherche-web",
  "search-web",
  "code",
  "execute",
  "run",
  "weather",
  "meteo",
  "doc",
  "document",
  "suggest",
  "suggestion",
  "calc",
  "calcul",
  "calculatrice",
  "convert",
  "conversion",
  "time",
  "date",
  "heure",
  "horloge",
  "fuseau",
  "timezone",
  "note",
  "memo",
  "mémo",
  "planning",
  "planification",
  "schedule",
  "home",
  "accueil",
  "racine",
  "chart",
  "graphique",
  "diagramme",
  "plot",
  "memory",
  "memoire",
  "souvenir",
  "qr",
  "qrcode",
  "summary",
  "resume",
  "synthese",
  "quiz",
  "quizz",
  "quizzly",
  "test",
  "tools-clear",
  "tools-off",
  "clear-tools",
  "theme",
  "delete",
  "purge",
];

const RESERVED = new Set(BUILT_IN_SLASH_COMMAND_TRIGGERS);

/**
 * Le déclencheur est-il réservé par une commande système ?
 *
 * Comparaison en minuscules : `api/commands` valide un `trigger` en
 * `[a-z0-9_-]` mais rien n'interdit qu'il arrive en majuscules d'un client
 * tiers, et `/Image` et `/image` visuellement la même commande.
 */
export function isReservedSlashCommandTrigger(trigger: unknown): boolean {
  return RESERVED.has(
    String(trigger ?? "")
      .trim()
      .toLowerCase()
  );
}
