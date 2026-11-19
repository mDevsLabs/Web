/**
 * Lecture sécurisée et normalisée d'une variable d'environnement (trim + exclusion chaîne vide).
 */
export function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}
