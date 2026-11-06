/** Nombre de tendances affichées sur l'accueil de mAI Search. */
export const TREND_COUNT = 4;

/**
 * Tire `count` sujets distincts pour l'accueil.
 *
 * Le lot déjà affiché est écarté tant que le catalogue contient assez
 * d'autres sujets : Rafraîchir doit changer la rangée, pas la rejouer.
 * Un catalogue plus court que `count` est rendu tel quel.
 */
export function pickTrends(
  catalog: readonly string[],
  previous: readonly string[] = [],
  count = TREND_COUNT,
  random: () => number = Math.random
): string[] {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const item of catalog) {
    const label = item.trim();
    if (!label || seen.has(label)) {
      continue;
    }
    seen.add(label);
    unique.push(label);
  }
  if (unique.length <= count) {
    return unique;
  }
  const excluded = new Set(previous);
  const pool = unique.filter((item) => !excluded.has(item));
  const source = pool.length >= count ? pool : unique;
  return shuffle(source, random).slice(0, count);
}

function shuffle(items: readonly string[], random: () => number): string[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const current = copy[index];
    const other = copy[swap];
    if (current === undefined || other === undefined) {
      continue;
    }
    copy[index] = other;
    copy[swap] = current;
  }
  return copy;
}
