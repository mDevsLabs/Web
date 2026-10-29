import "server-only";

import type { IntegrationHttpAuth } from "./providers";

/**
 * Présente un jeton comme l'API l'exige.
 *
 * Bearer est le cas courant. Les autres formes sont des littéraux du
 * descripteur : un en-tête dont le nom est sur liste blanche, un préfixe
 * `Token` ou `JWT`, un Basic dont l'identifiant vient du coffre, ou un
 * paramètre `access_token`. Rien de tout cela n'est choisi par le modèle.
 */

export type BuiltAuth =
  | {
      authorization: string | null;
      headers: Record<string, string>;
      ok: true;
      query: Record<string, string>;
    }
  | { error: string; ok: false };

const HEADER_NAMES: Record<string, string> = {
  "api-key": "api-key",
  "x-subscription-token": "X-Subscription-Token",
};

export function buildRequestAuth(
  auth: IntegrationHttpAuth | undefined,
  token: string,
  fields: Record<string, string>
): BuiltAuth {
  if (!token) {
    return { error: "Jeton manquant.", ok: false };
  }
  const scheme = auth ?? { kind: "bearer" as const };
  switch (scheme.kind) {
    case "bearer":
      return {
        authorization: `Bearer ${token}`,
        headers: {},
        ok: true,
        query: {},
      };
    case "none":
      return { authorization: null, headers: {}, ok: true, query: {} };
    case "header": {
      const name = HEADER_NAMES[scheme.name.toLowerCase()];
      if (!name) {
        return { error: "En-tête d'authentification refusé.", ok: false };
      }
      return {
        authorization: null,
        headers: { [name]: token },
        ok: true,
        query: {},
      };
    }
    case "prefix":
      return {
        authorization: `${scheme.prefix} ${token}`,
        headers: {},
        ok: true,
        query: {},
      };
    case "basic": {
      const user = fields[scheme.userField];
      if (!user || /[\r\n:]/.test(user) || /[\r\n]/.test(token)) {
        return { error: "Identifiant Basic incomplet.", ok: false };
      }
      return {
        authorization: `Basic ${Buffer.from(`${user}:${token}`, "utf8").toString("base64")}`,
        headers: {},
        ok: true,
        query: {},
      };
    }
    case "query":
      if (scheme.name !== "access_token") {
        return { error: "Paramètre d'authentification refusé.", ok: false };
      }
      return {
        authorization: null,
        headers: {},
        ok: true,
        query: { access_token: token },
      };
    default:
      return { error: "Authentification inconnue.", ok: false };
  }
}
