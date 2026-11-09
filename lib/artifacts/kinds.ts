export const ARTIFACT_KINDS = [
  "text",
  "code",
  "image",
  "sheet",
  "html",
] as const;

export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];
