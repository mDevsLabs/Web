/** Le cookie HttpOnly est contrôlé par le serveur ; une panne réseau n'est pas une déconnexion. */
export async function readAuthentication(url: string): Promise<boolean> {
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
  });
  if (response.status === 401) return false;
  if (!response.ok)
    throw new Error("Vérification de la connexion indisponible.");
  const data = await response.json();
  if (typeof data.authenticated !== "boolean")
    throw new Error("Réponse de connexion invalide.");
  return data.authenticated;
}
