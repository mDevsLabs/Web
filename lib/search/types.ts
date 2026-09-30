// Index de recherche interne : le CONTRAT entre le serveur qui interroge les
// tables et la page qui les affiche.
//
// Ce module est importable côté client — il ne contient que des clés, des
// libellés et des types. La logique SQL vit dans `lib/search/index-query.ts`,
// qui est `server-only`. Les deux partagent cette liste de sources : c'est
// elle qui décide de l'ordre d'affichage et du nom des filtres, donc elle ne
// peut pas être dupliquée.
//
// ── Pourquoi un index plutôt que N appels depuis le navigateur ───────────────
//
// Dix sources, dix requêtes, et le même problème dans les deux sens : le
// navigateur ne peut pas chercher dans une table, et le serveur qui le ferait
// dix fois ne saurait pas dire à l'utilisateur « il y a 34 skills, 3 bots, 118
// messages ». Une seule route, une réponse, et des compteurs par source : le
// filtre « Skills (34) » devient informatif au lieu d'être deviné.
//
// ── Deux familles de sources, une seule interface ───────────────────────────
//
// - Les sources SQL interrogent la table avec un `ILIKE` et renvoient en même
//   temps leurs lignes ET leur nombre total, via `count(*) OVER ()`. Une
//   requête par source, pas deux.
// - Les sources « catalogue » ou « amont » (modèles, fichiers Cloud, historiques
//   média) ne sont pas en base locale : leur total est la longueur du tableau
//   reçu, et il est donc exact.
//
// `capped` distingue les deux : il dit qu'une source a été plafonnée par le
// `limit`, donc que « Charger plus » peut encore rapporter des résultats.

/**
 * Clés de sources.
 *
 * Une source est un emplacement du compte où l'on peut chercher, pas une
 * table : `chat` et `message` lisent `Chat` et `Message_v2`, `stats` agrège
 * `UsageEvent`. Ajouter une source, c'est ajouter une clé ici et une entrée
 * dans le registre du serveur — jamais une nouvelle requête côté client.
 */
export const SEARCH_SOURCE_KEYS = [
  "audio",
  "bot",
  "chat",
  "command",
  "doc",
  "file",
  "image",
  "mcp",
  "memory",
  "message",
  "model",
  "planning",
  "plugin",
  "project",
  "run",
  "skill",
  "stats",
] as const;

export type SearchSourceKey = (typeof SEARCH_SOURCE_KEYS)[number];

export function isSearchSourceKey(value: string): value is SearchSourceKey {
  return (SEARCH_SOURCE_KEYS as readonly string[]).includes(value);
}

/** Étiquettes des sources : un seul endroit fait autorité sur la casse. */
export const SEARCH_SOURCE_LABELS: Record<SearchSourceKey, string> = {
  audio: "Générations audio",
  bot: "Bots",
  chat: "Discussions",
  command: "Commandes",
  doc: "Fichiers de projet",
  file: "Fichiers",
  image: "Générations d'images",
  mcp: "Serveurs MCP",
  memory: "Mémoire",
  message: "Messages",
  model: "Modèles",
  planning: "Planification",
  plugin: "Plugins",
  project: "Projets",
  run: "Étapes d'agent",
  skill: "Skills",
  stats: "Modèles utilisés",
};

/**
 * Sources réservées aux forfaits payants.
 *
 * `/api/mcp`, `/api/agents` et `/api/plugins` répondent `plan_required` à un
 * compte Free. Les interroger quand même coûterait trois 403 pour afficher un
 * vide : la page les retire simplement de ses filtres, sur le même modèle que
 * la barre latérale.
 */
export const PAID_ONLY_SOURCES: SearchSourceKey[] = ["bot", "mcp", "plugin"];

/** Un résultat, quelle que soit sa source. */
export type SearchHit = {
  /** Chemin interne (« /chat/… ») ou URL absolue pour un fichier Cloud. */
  href: string;
  /** Identifiant stable dans la source : sert de clé React et de lien profond. */
  id: string;
  /** Précision d'affichage à droite : date, compte, nombre de tokens. */
  meta?: string;
  /**
   * Texte à laisser dans la boîte de saisie du Chat après navigation.
   *
   * Utilisé par les commandes enregistrées : la cible naturelle d'un
   * « /recherche » est la boîte qui l'exécute. Rien n'est envoyé tout seul —
   * l'utilisateur valide, comme s'il l'avait tapé.
   */
  pendingPrompt?: string;
  source: SearchSourceKey;
  /** Ligne secondaire : extrait, description, chemin, nom du modèle. */
  subtitle?: string;
  title: string;
  /** Les fichiers Cloud s'ouvrent hors de l'application. */
  external?: boolean;
};

export type SearchIndexResponse = {
  /**
   * Nombre de résultats par source pour la requête courante.
   *
   * Volontairement un objet et non un nombre global : c'est ce qui permet aux
   * pastilles de filtre d'afficher « Skills (34) » et à l'utilisateur de
   * choisir où regarder avant de faire défiler.
   */
  counts: Partial<Record<SearchSourceKey, number>>;
  /**
   * Sources sollicitées qui n'ont pas répondu.
   *
   * Distinguer « aucun résultat » de « source injoignable » est la seule façon
   * d'éviter un mensonge : une table absente sur un environnement non migré ne
   * doit pas ressembler à un compte sans mémoire.
   */
  failed: SearchSourceKey[];
  hits: SearchHit[];
  /** Décalage suivant, ou `null` quand toutes les sources sont épuisées. */
  nextOffset: number | null;
  total: number;
};

/** Départ d'une interrogation d'une source, avant transformation en hits. */
export type SourceResult = {
  /** La source a plus de résultats que `limit` : « charger plus » peut suivre. */
  capped: boolean;
  hits: SearchHit[];
  /** Nombre total correspondant, même quand `hits` est tronqué. */
  total: number;
};

/**
 * Une interrogation de source.
 *
 * `offset` est GLOBAL, pas par source : c'est le prix d'un compte unique. Une
 * recherche est un balayage, on avance donc uniformément dans toutes les
 * sources plutôt que d'épuiser l'une avant l'autre — l'utilisateur ne sait pas
 * d'avance laquelle l'intéresse.
 */
export type SourceSearchContext = {
  isPaid: boolean;
  limit: number;
  offset: number;
  /** Identité résolue, pour les sources dont l'accès passe par un projet. */
  user: { email: string | null; id: string | null };
  /** Variantes d'identité : `userId` est un texte libre (id, email, pseudo). */
  userIds: string[];
};
