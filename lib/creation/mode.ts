// La même liste valide le réglage serveur et le curseur de Création.
export const CREATION_MODES = ["image", "audio"] as const;
export type CreationMode = (typeof CREATION_MODES)[number];

export function isCreationMode(value: unknown): value is CreationMode {
  return value === "image" || value === "audio";
}

export function normalizeCreationMode(value: unknown): CreationMode {
  return isCreationMode(value) ? value : "image";
}
