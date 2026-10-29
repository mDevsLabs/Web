import "server-only";

/**
 * Un seul coffre, parfois deux renseignements.
 *
 * `IntegrationConnection.accessToken` ne porte qu'une valeur chiffrée. Les
 * connecteurs à un seul jeton y restent en clair relatif (la chaîne du jeton,
 * puis le chiffrement du dépôt) : les lignes Vercel déjà stockées se relisent
 * sans migration. Quand un site, une zone ou un SID accompagne le secret, les
 * deux voyagent dans la même valeur, sous un préfixe que ne peut pas produire
 * un jeton de fournisseur collé tel quel.
 */

const PREFIX = "mai-cred.v1.";

export type StoredCredential = {
  fields: Record<string, string>;
  token: string;
};

export function packCredential(
  token: string,
  fields: Record<string, string>
): string {
  return (
    PREFIX +
    Buffer.from(JSON.stringify({ fields, token }), "utf8").toString("base64url")
  );
}

export function unpackCredential(stored: string): StoredCredential {
  if (!stored.startsWith(PREFIX)) {
    return { fields: {}, token: stored };
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(stored.slice(PREFIX.length), "base64url").toString("utf8")
    ) as { fields?: unknown; token?: unknown };
    if (typeof parsed.token !== "string" || !parsed.token) {
      return { fields: {}, token: "" };
    }
    const fields: Record<string, string> = {};
    if (
      parsed.fields &&
      typeof parsed.fields === "object" &&
      !Array.isArray(parsed.fields)
    ) {
      for (const [key, value] of Object.entries(parsed.fields)) {
        if (typeof value === "string") {
          fields[key] = value;
        }
      }
    }
    return { fields, token: parsed.token };
  } catch {
    return { fields: {}, token: "" };
  }
}
