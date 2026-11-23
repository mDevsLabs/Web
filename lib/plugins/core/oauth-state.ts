import { readEnv } from "@/lib/utils/env";
import "server-only";

import { randomBytes } from "node:crypto";
import { decrypt, encrypt, isEncryptionConfigured } from "@/lib/mcp/encryption";

/**
 * État scellé et URI de rappel OAuth pour les plugins OAuth personnels
 * (`/api/user-plugins/[id]/connect` et `callback`).
 *
 * L'« état » porte l'identité du compte qui a lancé la connexion et est chiffré
 * via `MCP_ENCRYPTION_KEY` (AES-GCM), confronté au cookie nonce httpOnly.
 */

export const MAI_OAUTH_STATE_COOKIE = "mai_oauth_nonce";
/** Durée de vie d'un état : le temps d'un aller-retour sur l'écran de consentement. */
export const STATE_TTL_MS = 5 * 60 * 1000;
export const STATE_COOKIE_MAX_AGE_S = 10 * 60;

export function stateCookieName(provider: string): string {
  return `${MAI_OAUTH_STATE_COOKIE}-${provider}`;
}

export function stateCookiePath(basePath = ""): string {
  return `${basePath.replace(/\/+$/, "")}/api/user-plugins`;
}

export function newNonce(): string {
  return randomBytes(16).toString("base64url");
}

export type OAuthStatePayload = {
  /** Nonce confronté au cookie : double-submit qui ferme la porte à un état volé ailleurs. */
  n: string;
  p: string;
  /** Où ramener l'utilisateur après le consentement. */
  r: string;
  /** Identifiant du compte qui a lancé la connexion. */
  u: string;
  /** Identifiant du plugin personnel lié. */
  i?: string;
  /** Expiration, epoch ms. */
  x: number;
};

export function sanitizeReturnTo(
  raw: string | null | undefined
): string | null {
  if (!raw?.startsWith("/")) {
    return null;
  }
  if (raw.startsWith("//") || raw.includes("\\")) {
    return null;
  }
  return raw.slice(0, 500);
}

export function sealState(payload: OAuthStatePayload): string {
  if (!isEncryptionConfigured()) {
    throw new Error(
      "Coffre non configuré : MCP_ENCRYPTION_KEY manquante, impossible de sceller un état OAuth."
    );
  }
  return encrypt(JSON.stringify(payload));
}

export function openState(
  raw: string | null | undefined,
  expected: { nonce: string | undefined; provider: string }
): OAuthStatePayload | null {
  if (!raw || !isEncryptionConfigured()) {
    return null;
  }
  const plain = decrypt(raw);
  if (!plain) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(plain);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  const payload = parsed as Partial<OAuthStatePayload>;
  if (
    typeof payload.n !== "string" ||
    typeof payload.p !== "string" ||
    typeof payload.r !== "string" ||
    typeof payload.u !== "string" ||
    (payload.i !== undefined && typeof payload.i !== "string") ||
    typeof payload.x !== "number"
  ) {
    return null;
  }
  if (payload.p !== expected.provider) {
    return null;
  }
  if (!expected.nonce || payload.n !== expected.nonce) {
    return null;
  }
  if (payload.x < Date.now()) {
    return null;
  }
  return sanitizeReturnTo(payload.r) ? (payload as OAuthStatePayload) : null;
}

export function callbackUriFor(params: {
  protocol?: string | null;
  requestUrl: string;
}): string | null {
  let url: URL;
  try {
    url = new URL(params.requestUrl);
  } catch {
    return null;
  }
  if (!/\/(connect|callback)\/?$/.test(url.pathname)) {
    return null;
  }
  const pathname = url.pathname.replace(
    /\/(connect|callback)\/?$/,
    "/callback"
  );
  const override = readEnv("MAI_OAUTH_REDIRECT_BASE_URL");
  if (override) {
    try {
      return `${new URL(override).origin}${pathname}`;
    } catch {
      return null;
    }
  }
  const forwarded = params.protocol?.split(",")[0]?.trim();
  const scheme = forwarded
    ? forwarded.endsWith(":")
      ? forwarded
      : `${forwarded}:`
    : url.protocol;
  return `${scheme}//${url.host}${pathname}`;
}
