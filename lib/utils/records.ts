/**
 * Type guard et utilitaire strict pour les enregistrements (objets non nuls et non tableaux).
 * Contrat strict : renvoie `null` si la valeur n'est pas un dictionnaire/record valide.
 */
export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

/**
 * Version tolérante renvoyant un objet vide par défaut `{}`.
 */
export function asRecordOrEmpty(value: unknown): Record<string, unknown> {
  return asRecord(value) ?? {};
}
