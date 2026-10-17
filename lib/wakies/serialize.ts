import "server-only";

/**
 * Conversion des lignes PostgreSQL vers la forme JSON attendue par l'interface
 * portée.
 *
 * POURQUOI CETTE COUCHE
 *
 * Le gabarit lisait ses SQLite et sérialisait des entiers : `createdAt`,
 * `startedAt`, `endedAt` étaient des `Date.now()`, donc des nombres. L'interface
 * portée fait arithmétique dessus (durée d'un appel, « il y a 3 minutes »), et
 * `JSON.stringify(new Date())` lui DONNERAIT une chaîne ISO — donc NaN dans les
 * durées et un affichage faux.
 *
 * Plutôt que de réécrire une dizaines d'expressions client, la conversion se fait
 * ici, à la frontière : les dates partent en millisecondes, comme avant. La
 * règle est explicite et unique : `Date` → `epoch ms`, récursivement, et rien
 * d'autre n'est touché.
 *
 * Elle retire aussi `userId` : l'interface connaît déjà le compte courant, et
 * lui renvoyer son identifiant n'apporte rien.
 */
export function versClient<T>(valeur: T): T {
  if (valeur instanceof Date) {
    return valeur.getTime() as unknown as T;
  }
  if (Array.isArray(valeur)) {
    return valeur.map((element) => versClient(element)) as unknown as T;
  }
  if (valeur && typeof valeur === "object") {
    const sortie: Record<string, unknown> = {};
    for (const [cle, donnee] of Object.entries(
      valeur as Record<string, unknown>
    )) {
      if (cle === "userId") {
        continue;
      }
      sortie[cle] = versClient(donnee);
    }
    return sortie as T;
  }
  return valeur;
}
