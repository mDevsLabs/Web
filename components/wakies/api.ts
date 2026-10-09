"use client";

/**
 * Client HTTP de l'application Wakies.
 *
 * Le gabarit (`apps/wakies/src/client/api.ts`) conservait un jeton porteur en
 * `sessionStorage` : l'`OWNER_TOKEN` du serveur, saisi à la main, propre à UN
 * poste. Intégré à mAI, il n'y a plus de jeton à détenir — la session est un
 * cookie httpOnly que le navigateur joint automatiquement et qu'aucun
 * composant ne peut lire. Conserver une copie en `sessionStorage` aurait deux
 * défauts : elle serait lisible par n'importe quel script de la page, et elle
 * divergerait de la session réelle dès qu'elle expire.
 *
 * Conséquence : plus aucun 401 « entrez votre jeton », et les erreurs portent
 * le message du serveur (déjà en français) au lieu d'un texte générique.
 */

const RACINE = "/api/wakies";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** `credentials: "same-origin"` est explicite : le cookie de session en dépend. */
function options(method: string, body?: unknown): RequestInit {
  return {
    credentials: "same-origin",
    headers:
      method === "GET" || method === "HEAD"
        ? undefined
        : { "Content-Type": "application/json" },
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}

export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  const reponse = await fetch(
    path.startsWith("/api/") ? path : `${RACINE}${path}`,
    { ...options(method, body), signal }
  );
  const donnees = (await reponse.json().catch(() => null)) as {
    error?: string;
    message?: string;
  } | null;
  if (!reponse.ok) {
    throw new ApiError(
      donnees?.message ??
        donnees?.error ??
        `La requête a échoué (${reponse.status}).`,
      reponse.status
    );
  }
  return donnees as T;
}
