const DEFAULT_RETURN_TO = "/";

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code < 32 || code === 127) {
      return true;
    }
  }
  return false;
}

/**
 * Ne conserve que des chemins internes. Les URLs absolues et les variantes
 * protocol-relative sont rejetées pour éviter une open redirect après login.
 */
export function getSafeReturnTo(
  value: string | null | undefined,
  fallback = DEFAULT_RETURN_TO
): string {
  if (!value) {
    return fallback;
  }

  const candidate = value.trim();
  let decodedCandidate = candidate;
  try {
    decodedCandidate = decodeURIComponent(candidate);
  } catch {
    return fallback;
  }
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    decodedCandidate.startsWith("//") ||
    candidate.includes("\\") ||
    decodedCandidate.includes("\\") ||
    hasControlCharacter(candidate) ||
    hasControlCharacter(decodedCandidate)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, "https://mAI.invalid");
    if (parsed.origin !== "https://mai.invalid") {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function getReturnToFromSearch(search: string): string {
  const params = new URLSearchParams(search);
  return getSafeReturnTo(
    params.get("redirectUrl") ?? params.get("next") ?? undefined
  );
}
