import { createHash } from "node:crypto";
import { tool } from "ai";
import Papa from "papaparse";
import { z } from "zod";
import type { PluginDefinition, PluginManifest } from "../../../core/types";
import manifest from "./index.json";

const MAX_INPUT = 64_000;
const MAX_MATCHES = 50;
const MAX_CSV_ROWS = 200;

export const webParseUrl = tool({
  description:
    "Analyse une URL en composants structurés (origine, hôte, chemin, query params, hash) et peut ajouter/supprimer des paramètres.",
  execute: async ({ removeParams, setParams, url: rawUrl }) => {
    let url: URL;
    try {
      url = new URL(rawUrl.trim());
    } catch {
      return { error: "URL invalide : impossible de l'analyser." };
    }
    for (const key of removeParams ?? []) {
      url.searchParams.delete(key);
    }
    for (const [key, value] of Object.entries(setParams ?? {})) {
      url.searchParams.set(key, value);
    }
    const queryParams: Record<string, string[]> = {};
    for (const key of new Set(url.searchParams.keys())) {
      queryParams[key] = url.searchParams.getAll(key);
    }
    return {
      hash: url.hash || null,
      host: url.host,
      hostname: url.hostname,
      href: url.href,
      origin: url.origin,
      pathname: url.pathname,
      port: url.port || null,
      protocol: url.protocol,
      queryParams,
    };
  },
  inputSchema: z.object({
    removeParams: z.array(z.string().max(80)).max(20).optional(),
    setParams: z.record(z.string().max(80), z.string().max(500)).optional(),
    url: z.string().trim().min(1).max(4096),
  }),
});

export const webTestRegex = tool({
  description:
    "Teste une expression régulière JavaScript sur un texte (borné à 64 Ko) et retourne les correspondances.",
  execute: async ({ flags, pattern, text }) => {
    if (pattern.length > 400) {
      return { error: "Motif regex trop long (maximum 400 caractères)." };
    }
    if (!/^[gimsuy]*$/.test(flags ?? "")) {
      return {
        error: "Drapeaux regex invalides (autorisés : g, i, m, s, u, y).",
      };
    }
    let regex: RegExp;
    try {
      regex = new RegExp(pattern, flags ?? "g");
    } catch (error) {
      return {
        error: `Regex invalide : ${error instanceof Error ? error.message : "syntaxe incorrecte"}`,
      };
    }

    const matches: Array<{
      groups: Record<string, string> | null;
      index: number;
      match: string;
    }> = [];

    if (regex.global) {
      let count = 0;
      for (const hit of text.matchAll(regex)) {
        if (count >= MAX_MATCHES) break;
        matches.push({
          groups: hit.groups ? { ...hit.groups } : null,
          index: hit.index ?? 0,
          match: hit[0].slice(0, 500),
        });
        count += 1;
        if (hit[0] === "") break;
      }
    } else {
      const hit = regex.exec(text);
      if (hit) {
        matches.push({
          groups: hit.groups ? { ...hit.groups } : null,
          index: hit.index,
          match: hit[0].slice(0, 500),
        });
      }
    }

    return {
      matched: matches.length > 0,
      matches,
      total: matches.length,
      truncated: matches.length >= MAX_MATCHES,
    };
  },
  inputSchema: z.object({
    flags: z.string().max(10).default("g"),
    pattern: z.string().min(1).max(400),
    text: z.string().max(MAX_INPUT),
  }),
});

function decodeBase64UrlJson(segment: string): Record<string, unknown> | null {
  try {
    const json = Buffer.from(segment, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export const webInspectJwt = tool({
  description:
    "Décode localement l'en-tête et le payload d'un JWT sans vérifier sa signature cryptographique.",
  execute: async ({ token }) => {
    const parts = token.trim().split(".");
    if (parts.length !== 3) {
      return {
        error:
          "Format JWT invalide : trois segments séparés par des points sont attendus.",
      };
    }
    const header = decodeBase64UrlJson(parts[0] ?? "");
    const payload = decodeBase64UrlJson(parts[1] ?? "");
    if (!header || !payload) {
      return {
        error: "Impossible de décoder l'en-tête ou le payload JSON du JWT.",
      };
    }
    const exp = typeof payload.exp === "number" ? payload.exp : null;
    const iat = typeof payload.iat === "number" ? payload.iat : null;
    const nowSec = Math.floor(Date.now() / 1000);
    return {
      expired: exp === null ? null : exp < nowSec,
      expiresAt: exp === null ? null : new Date(exp * 1000).toISOString(),
      header,
      issuedAt: iat === null ? null : new Date(iat * 1000).toISOString(),
      payload,
      signaturePresent: (parts[2] ?? "").length > 0,
      signatureVerified: false,
    };
  },
  inputSchema: z.object({
    token: z.string().trim().min(10).max(16_000),
  }),
});

export const webCodec = tool({
  description:
    "Encode/décode du texte (Base64, Base64URL, URL) ou calcule un hash SHA-256 / SHA-512 localement.",
  execute: async ({ operation, text }) => {
    switch (operation) {
      case "base64_encode":
        return {
          operation,
          result: Buffer.from(text, "utf8").toString("base64"),
        };
      case "base64_decode":
        return {
          operation,
          result: Buffer.from(text.trim(), "base64").toString("utf8"),
        };
      case "base64url_encode":
        return {
          operation,
          result: Buffer.from(text, "utf8").toString("base64url"),
        };
      case "base64url_decode":
        return {
          operation,
          result: Buffer.from(text.trim(), "base64url").toString("utf8"),
        };
      case "url_encode":
        return { operation, result: encodeURIComponent(text) };
      case "url_decode":
        try {
          return { operation, result: decodeURIComponent(text) };
        } catch {
          return { error: "Chaîne URL-encodée invalide." };
        }
      case "sha256":
        return {
          operation,
          result: createHash("sha256").update(text, "utf8").digest("hex"),
        };
      case "sha512":
        return {
          operation,
          result: createHash("sha512").update(text, "utf8").digest("hex"),
        };
    }
  },
  inputSchema: z.object({
    operation: z.enum([
      "base64_encode",
      "base64_decode",
      "base64url_encode",
      "base64url_decode",
      "url_encode",
      "url_decode",
      "sha256",
      "sha512",
    ]),
    text: z.string().max(MAX_INPUT),
  }),
});

export const webParseCsv = tool({
  description:
    "Parse un texte CSV ou TSV en lignes structurées avec en-têtes et comptage.",
  execute: async ({ csv, delimiter, hasHeader, maxRows }) => {
    const parsed = Papa.parse<Record<string, unknown> | string[]>(csv, {
      ...(delimiter ? { delimiter } : {}),
      header: hasHeader,
      skipEmptyLines: true,
    });
    const capped = Math.min(Math.max(maxRows, 1), MAX_CSV_ROWS);
    const rows = parsed.data.slice(0, capped);
    return {
      columns: parsed.meta.fields ?? null,
      delimiter: parsed.meta.delimiter,
      errors: parsed.errors.slice(0, 10).map((err) => err.message),
      rows,
      totalRows: parsed.data.length,
      truncated: parsed.data.length > capped,
    };
  },
  inputSchema: z.object({
    csv: z.string().min(1).max(MAX_INPUT),
    delimiter: z.enum([",", ";", "\t", "|"]).optional(),
    hasHeader: z.boolean().default(true),
    maxRows: z.number().int().min(1).max(MAX_CSV_ROWS).default(50),
  }),
});

export const webToolboxPlugin: PluginDefinition = {
  createTools: () => ({
    webCodec,
    webInspectJwt,
    webParseCsv,
    webParseUrl,
    webTestRegex,
  }),
  manifest: manifest as PluginManifest,
};
