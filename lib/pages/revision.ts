// Verrou optimiste des pages. La base reste l'autorité (UPDATE … WHERE
// revision = attendue) : cette fonction est la règle partagée, testée, que
// la requête applique avant d'écrire.

export type RevisionDecision = { next: number; ok: true } | { ok: false };

export function decideRevision(
  current: number,
  expected: number
): RevisionDecision {
  if (!Number.isInteger(current) || !Number.isInteger(expected)) {
    return { ok: false };
  }
  if (current < 1 || current !== expected) {
    return { ok: false };
  }
  return { next: current + 1, ok: true };
}
