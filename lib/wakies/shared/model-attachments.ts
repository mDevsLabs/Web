/** Les formats proposés suivent les capacités du catalogue, sans déduire un modèle de son nom. */
const IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DOCUMENTS = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
];

export type CapacitesPieces = { images: boolean; documents: boolean };

export function capacitesPieces(capacites?: {
  image?: boolean;
  vision?: boolean;
  file?: boolean;
}): CapacitesPieces {
  return {
    documents: Boolean(capacites?.file),
    images: Boolean(capacites?.image || capacites?.vision),
  };
}

export function acceptePiece(
  type: string,
  capacites: CapacitesPieces
): boolean {
  return (
    (capacites.images && IMAGES.includes(type)) ||
    (capacites.documents && DOCUMENTS.includes(type))
  );
}

export function formatsPieces(capacites: CapacitesPieces): string {
  return [
    ...(capacites.images ? IMAGES : []),
    ...(capacites.documents ? DOCUMENTS : []),
  ].join(",");
}
