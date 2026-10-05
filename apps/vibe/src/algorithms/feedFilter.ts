/**
 * ============================================================================
 * VIBE — ALGORITHMES FILTRAGE FEED (src/algorithms/feedFilter.ts)
 * Filtrage client « ceinture et bretelles » en complément du filtrage serveur :
 * retrait des posts d'auteurs masqués (mute) ou bloqués, déduplication.
 * ============================================================================
 */

export interface HidableAuthor {
  username?: string;
  display_name?: string;
  author_id?: number;
}

/**
 * Retourne true si l'auteur est masqué/bloqué. Les comparaisons sont
 * insensibles à la casse et ignorent le « @ » initial.
 */
export function isAuthorHidden(
  author: HidableAuthor | undefined,
  hiddenUsernames: Iterable<string>
): boolean {
  if (!author) return false;
  const candidates = new Set<string>();
  if (author.username) candidates.add(author.username.toLowerCase().replace(/^@/, ''));
  if (author.display_name) candidates.add(author.display_name.toLowerCase());
  for (const hidden of hiddenUsernames) {
    if (candidates.has(hidden.toLowerCase().replace(/^@/, ''))) return true;
  }
  return false;
}

export function filterHiddenPosts<T extends HidableAuthor>(
  posts: T[],
  hiddenUsernames: Iterable<string>
): T[] {
  const hidden = Array.from(hiddenUsernames);
  if (hidden.length === 0) return posts;
  return posts.filter((p) => !isAuthorHidden(p, hidden));
}

/** Déduplique par id en conservant le premier rencontré. */
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
