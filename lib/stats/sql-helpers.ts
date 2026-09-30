// Petits utilitaires partagés par les modules d'agrégation de la page
// Statistiques. Isolés pour que `usage-stats.ts` (consommation et conversations)
// et `activity-stats.ts` (activité quotidienne, séries, outils) ne se dupliquent
// pas — et pour que la règle d'identité, qui est une convention de TOUTE la
// page, ait une source unique.
//
// Aucun accès base ici : ce module est importable côté client, ce qui permet
// aux composants de formulaire de résoudre un périmètre d'identité sans tirer
// un module `server-only` dans leur graphe.

/** Convertit un agrégat renvoyé par Postgres en nombre, sans jamais throw. */
export function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Périmètre d'identité d'un utilisateur.
 *
 * `userId` est un `text` libre dans TOUTES les tables lues, et
 * `recordTokenUsage` y écrit `userId || userEmail` (lib/db/queries.ts). Un
 * compte dont l'identifiant a été réécrit, ou dont les lignes anciennes ont été
 * écrites sous forme d'email, verrait son historique disparaître si l'on
 * filtrait sur le seul identifiant courant. On retient donc les deux formes.
 * C'est aussi la seule approche compatible avec le `inArray` utilisé partout,
 * qui doit rester stable quelle que soit la forme stockée.
 *
 * Limite connue et assumée : les lignes écrites historiquement sous forme de
 * NOM D'UTILISATEUR ne sont pas retrouvées ici. `lib/agent/channel.ts` documente
 * cette polygonie ancienne ; la les couvrir demanderait un troisième
 * paramètre que l'API de session ne fournit pas.
 */
export function resolveUserIdScope(user: {
  email?: string | null;
  id?: string | null;
}): string[] {
  const candidates = [user.id, user.email]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);
  return [...new Set(candidates)];
}
