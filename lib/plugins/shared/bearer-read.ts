import "server-only";

import type {
  IntegrationDescriptor,
  IntegrationHttpAuth,
  IntegrationProviderId,
} from "@/lib/integrations/providers";
import { buildRequestAuth } from "@/lib/integrations/request-auth";
import type { PluginToolDeps } from "../types";
import {
  type AuthorizedResult,
  bearerFor,
  callAuthorized,
} from "./authorized-api";

/**
 * Lecture JSON authentifiée partagée par les plugins à jeton.
 *
 * Le chemin et l'hôte viennent du code du plugin, jamais du modèle : `callAuthorized`
 * refuse un hôte absent de la liste blanche du connecteur. Le modèle ne choisit
 * que des filtres (identifiant, volume), bornés par le schéma de l'outil.
 */

export function dig(payload: unknown, path?: string): unknown {
  if (!path) {
    return payload;
  }
  let current = payload;
  for (const key of path.split(".")) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function jsonRecords(
  payload: unknown,
  path?: string
): Record<string, unknown>[] {
  const source = dig(payload, path);
  if (!Array.isArray(source)) {
    return [];
  }
  return source.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item)
  );
}

export function textField(value: unknown, max = 240): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return typeof value === "string" && value ? value.slice(0, max) : null;
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export async function loadCredential(
  deps: PluginToolDeps,
  providerId: IntegrationProviderId
): Promise<
  AuthorizedResult<{ fields: Record<string, string>; token: string }>
> {
  const token = await bearerFor(deps, providerId);
  if (!token.ok) {
    return token;
  }
  let fields: Record<string, string> = {};
  const raw = await deps.secretResolver?.({
    key: `${providerId}.fields`,
    kind: "auth",
  });
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === "string") {
            fields[key] = value;
          }
        }
      }
    } catch {
      fields = {};
    }
  }
  return { data: { fields, token: token.data }, ok: true };
}

export async function callProvider(params: {
  auth?: IntegrationHttpAuth;
  base: string;
  body?: string;
  descriptor: IntegrationDescriptor;
  fields?: Record<string, string>;
  headers?: Record<string, string>;
  method?: "GET" | "POST";
  path: string;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
  token: string;
}): Promise<AuthorizedResult<unknown>> {
  const built = buildRequestAuth(
    params.auth,
    params.token,
    params.fields ?? {}
  );
  if (!built.ok) {
    return built;
  }
  return callAuthorized({
    accessToken: params.token,
    authorization: built.authorization,
    base: params.base,
    body: params.body,
    descriptor: params.descriptor,
    headers: {
      Accept: "application/json",
      ...params.headers,
      ...built.headers,
    },
    method: params.method,
    path: params.path,
    query: { ...params.query, ...built.query },
    signal: params.signal,
  });
}

export async function readBearer(params: {
  base: string;
  body?: string;
  deps: PluginToolDeps;
  descriptor: IntegrationDescriptor;
  headers?: Record<string, string>;
  method?: "GET" | "POST";
  path: string;
  providerId: IntegrationProviderId;
  query?: Record<string, string | number | undefined>;
}): Promise<{ error: string; ok: false } | { data: unknown; ok: true }> {
  const token = await bearerFor(params.deps, params.providerId);
  if (!token.ok) {
    return token;
  }
  return callAuthorized({
    accessToken: token.data,
    base: params.base,
    body: params.body,
    descriptor: params.descriptor,
    headers: params.headers,
    method: params.method,
    path: params.path,
    query: params.query,
    signal: params.deps.signal,
  });
}
