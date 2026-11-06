// L'identifiant de session est `users.id`, parfois l'email quand l'id manque.
// Une page créée sous l'une de ces formes doit rester reconnue comme sienne.

export function pageOwnerIds(userId: string, email?: string | null): string[] {
  const ids = new Set<string>();
  if (userId.trim()) {
    ids.add(userId);
  }
  if (email?.trim()) {
    ids.add(email);
  }
  return [...ids];
}

export function isPageAuthor(
  pageUserId: string,
  userId: string,
  email?: string | null
): boolean {
  return pageOwnerIds(userId, email).includes(pageUserId);
}
