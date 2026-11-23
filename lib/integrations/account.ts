import "server-only";

import { unpackCredential } from "./credential-envelope";
import { allowedHttpsUrl } from "./hosts";
import type { IntegrationDescriptor } from "./providers";
import { buildRequestAuth } from "./request-auth";
import { fillCredentialUrl } from "./token-fields";

/**
 * Validation d'un jeton personnel auprès du fournisseur et résolution de
 * l'identité du compte associé (`POST /api/integration/[provider]/token`).
 */

const TOKEN_TIMEOUT_MS = 10_000;
const TOKEN_MAX_BYTES = 64_000;

export type AccountIdentity = {
  accountEmail: string | null;
  accountLabel: string | null;
  providerAccountId: string;
};

async function readCappedBody(response: Response): Promise<string> {
  if (!response.body) {
    return await response.text();
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    received += value.byteLength;
    if (received > TOKEN_MAX_BYTES) {
      await reader.cancel();
      throw new Error("Réponse d'identité trop volumineuse");
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function requestJson(
  url: string,
  init: RequestInit
): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(url, {
      ...init,
      redirect: "error",
      signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }
    const parsed = JSON.parse(
      (await readCappedBody(response)) || "{}"
    ) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function readPath(value: unknown, path: string | undefined): unknown {
  if (!path) {
    return value;
  }
  let current: unknown = value;
  for (const key of path.split(".")) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Vérifie un jeton personnel (avec ses champs éventuels) sur l'API du
 * fournisseur et retourne l'identité vérifiée, ou `null` si le jeton est
 * invalide/refusé.
 */
export async function resolveAccount(
  descriptor: IntegrationDescriptor,
  storedCredential: string
): Promise<AccountIdentity | null> {
  const account = descriptor.account;
  let material = unpackCredential(storedCredential);
  let auth = account.auth;

  if (account.login) {
    const username = material.fields[account.login.usernameField];
    if (!username) {
      return null;
    }
    const loginUrl = allowedHttpsUrl(descriptor, account.login.url);
    if (!loginUrl) {
      return null;
    }
    const login = await requestJson(loginUrl.toString(), {
      body: JSON.stringify({ password: material.token, username }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    if (!login) {
      return null;
    }
    const session =
      asString(readPath(login, account.login.tokenPath)) ??
      asString(readPath(login, "access_token"));
    if (!session) {
      return null;
    }
    material = { fields: material.fields, token: session };
    auth = account.login.auth;
  }

  const filled = fillCredentialUrl(account.url, material);
  if (!filled) {
    return null;
  }
  const endpoint = allowedHttpsUrl(descriptor, filled);
  if (!endpoint) {
    return null;
  }
  const built = buildRequestAuth(auth, material.token, material.fields);
  if (!built.ok) {
    return null;
  }
  for (const [key, value] of Object.entries(built.query)) {
    endpoint.searchParams.set(key, value);
  }
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...built.headers,
    ...account.headers,
  };
  if (built.authorization) {
    headers.Authorization = built.authorization;
  }
  const raw = await requestJson(endpoint.toString(), {
    body: account.body,
    headers,
    method: account.method ?? "GET",
  });
  if (!raw) {
    return null;
  }

  const payload = readPath(raw, account.responsePath);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const record = payload as Record<string, unknown>;
  if (account.expect) {
    const got = readPath(record, account.expect.path);
    if (String(got ?? "") !== account.expect.equals) {
      return null;
    }
  }
  const rawId = readPath(record, account.idField);
  const providerAccountId =
    typeof rawId === "number" || typeof rawId === "string"
      ? String(rawId)
      : (account.idFallback ?? null);
  if (!providerAccountId) {
    return null;
  }
  const email = account.emailField
    ? asString(readPath(record, account.emailField))
    : null;
  const label =
    account.labelFields
      .map((field) => asString(readPath(record, field)))
      .find((value): value is string => Boolean(value)) ??
    email ??
    account.labelFallback;

  return {
    accountEmail: email,
    accountLabel: label ?? providerAccountId,
    providerAccountId,
  };
}
