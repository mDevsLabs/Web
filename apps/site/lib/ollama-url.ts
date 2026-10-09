/**
 * Résolution sécurisée de l'hôte Ollama local.
 *
 * `OLLAMA_BASE_URL` est une variable d'environnement : une valeur malveillante ou
 * une erreur de configuration suffirait à transformer ces routes en proxy SSRF
 * capable de requêter n'importe quelle URL interne depuis le serveur. On valide donc
 * systématiquement que la cible est bien une boucle locale.
 */

const LOOPBACK_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]", "::1"];

/** Délai maximal d'attente d'une réponse d'Ollama, en millisecondes. */
export const OLLAMA_TIMEOUT_MS = 15_000;

/**
 * Retourne l'URL d'Ollama si — et seulement si — elle pointe sur la machine locale.
 * `null` signifie « configuration invalide » : l'appelant doit refuser l'opération.
 */
export function getLoopbackOllamaUrl(): URL | null {
  const configured = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  try {
    const url = new URL(configured);
    if (!LOOPBACK_HOSTNAMES.includes(url.hostname)) return null;
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

/** `fetch` vers Ollama avec un délai maximal, pour ne pas laisser la route pendre. */
export function fetchOllama(input: string, init: RequestInit = {}): Promise<Response> {
  return fetch(input, { signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS), ...init });
}
