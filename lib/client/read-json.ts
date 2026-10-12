// Une panne de lecture doit rester une erreur, jamais devenir une liste vide.
import { extractApiErrorMessage } from "@/lib/api/client-error";

export async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload === null) {
    throw new Error(
      extractApiErrorMessage(payload) || "Impossible de charger les données."
    );
  }
  return payload as T;
}
