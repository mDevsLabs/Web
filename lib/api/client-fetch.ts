// Fetchers SWR typés par la FORME de la réponse, pas seulement par le code
// HTTP. Le `= []` par défaut de SWR ne couvre que `undefined` : une réponse
// 200/401 dont le corps n'est pas un tableau (enveloppe d'erreur
// `{ code, message, status }`, `null`, page HTML d'erreur Next en dev)
// empoisonnait le cache, et le moindre `skills.map` levait ensuite à CHAQUE
// rendu du composant — donc sur toute la page, pas seulement le menu concerné.
//
// Ces fetchers PROMISSENT la forme : un corps inattendu est rejeté comme une
// erreur HTTP l'aurait été. SWR garde alors `data === undefined` et réessaie,
// et le consommateur retombe sur sa liste vide au lieu de casser. Le second
// verrou est `Array.isArray(...)` à la lecture : un cache SWR déjà pollué par
// une version antérieure ne doit pas pouvoir faire tomber l'interface.

async function fetchJsonPayload(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} sur ${url}`);
  }
  return response.json();
}

/** Fetcher SWR pour une route qui renvoie directement un tableau JSON. */
export async function jsonArray<T>(url: string): Promise<T[]> {
  const payload = await fetchJsonPayload(url);
  if (!Array.isArray(payload)) {
    throw new TypeError(`Réponse inattendue (tableau attendu) : ${url}`);
  }
  return payload as T[];
}

/** Fetcher SWR pour une route qui renvoie un objet JSON. */
export async function jsonObject<T>(url: string): Promise<T> {
  const payload = await fetchJsonPayload(url);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError(`Réponse inattendue (objet attendu) : ${url}`);
  }
  return payload as T;
}

/**
 * Dernier verrou de lecture : rend une liste toujours exploitable, quel que
 * soit ce qu'a mis le cache (réponse d'erreur, `null`, champ manquant).
 */
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
