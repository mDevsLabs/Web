/** Centres d'intérêt proposés (onboarding + suggestions du profil). */
export const INTEREST_SUGGESTIONS = [
  "Tech",
  "IA",
  "Musique",
  "Cinéma",
  "Sport",
  "Cuisine",
  "Voyage",
  "Photo",
  "Gaming",
  "Littérature",
  "Science",
  "Art",
  "Mode",
  "Humour",
  "News",
  "Crypto",
];

export const MAX_INTERESTS = 5;
export const MAX_INTEREST_LENGTH = 30;

/** Normalise un tag saisi : trim, sans # de tête, borné à la longueur max. */
export const normalizeInterest = (
  raw: string,
  maxLength = MAX_INTEREST_LENGTH
): string | null => {
  const tag = raw.trim().replace(/^#+/, "").trim();
  if (!tag) return null;
  return tag.slice(0, maxLength);
};
