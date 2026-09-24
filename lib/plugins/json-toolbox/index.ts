import { tool } from "ai";
import { z } from "zod";
import type { PluginDefinition, PluginManifest } from "../types";
import manifest from "./index.json";

// Boîte à outils 100 % locale : aucun appel réseau, aucune écriture. Les bornes
// empêchent qu'un document volumineux épuise la génération ou produise une
// sortie inexploitable.
const MAX_PAYLOAD_CHARS = 262_144; // 256 Ko
const MAX_DEPTH = 64;
const MAX_ENTRIES = 500;
const MAX_OUTPUT_CHARS = 100_000;

type ParseResult =
  | { ok: true; value: unknown; depth: number }
  | { ok: false; error: string };

function measureDepth(value: unknown, depth = 1): number {
  if (depth > MAX_DEPTH) {
    return depth;
  }
  if (Array.isArray(value)) {
    return value.reduce<number>(
      (max, item) => Math.max(max, measureDepth(item, depth + 1)),
      depth
    );
  }
  if (value !== null && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).reduce<number>(
      (max, item) => Math.max(max, measureDepth(item, depth + 1)),
      depth
    );
  }
  return depth;
}

function parseJson(raw: string, label: string): ParseResult {
  if (raw.length > MAX_PAYLOAD_CHARS) {
    return {
      error: `${label} dépasse la limite de ${MAX_PAYLOAD_CHARS} caractères.`,
      ok: false,
    };
  }
  try {
    const value: unknown = JSON.parse(raw);
    const depth = measureDepth(value);
    if (depth > MAX_DEPTH) {
      return {
        error: `${label} dépasse la profondeur maximale de ${MAX_DEPTH} niveaux.`,
        ok: false,
      };
    }
    return { depth, ok: true, value };
  } catch (error) {
    return {
      error: `Syntaxe JSON invalide dans ${label} : ${
        error instanceof Error ? error.message : "erreur inconnue"
      }`,
      ok: false,
    };
  }
}

function collectPaths(
  value: unknown,
  prefix: string,
  out: Array<{ path: string; type: string; value?: unknown }>
): boolean {
  if (out.length >= MAX_ENTRIES) {
    return true;
  }
  if (Array.isArray(value)) {
    out.push({ path: prefix, type: "array" });
    for (let index = 0; index < value.length; index += 1) {
      if (collectPaths(value[index], `${prefix}[${index}]`, out)) {
        return true;
      }
    }
    return false;
  }
  if (value !== null && typeof value === "object") {
    out.push({ path: prefix, type: "object" });
    for (const [key, child] of Object.entries(
      value as Record<string, unknown>
    )) {
      const childPath = /^[A-Za-z_$][\w$]*$/.test(key)
        ? `${prefix}.${key}`
        : `${prefix}["${key}"]`;
      if (collectPaths(child, childPath, out)) {
        return true;
      }
    }
    return false;
  }
  out.push({
    path: prefix,
    type: value === null ? "null" : typeof value,
    value: value === null || typeof value === "object" ? undefined : value,
  });
  return false;
}

type DiffEntry = {
  from?: unknown;
  kind: "added" | "changed" | "removed";
  path: string;
  to?: unknown;
};

function diffValues(
  left: unknown,
  right: unknown,
  path: string,
  out: DiffEntry[]
): boolean {
  if (out.length >= MAX_ENTRIES) {
    return true;
  }
  if (left === right) {
    return false;
  }
  const leftIsObject = left !== null && typeof left === "object";
  const rightIsObject = right !== null && typeof right === "object";
  if (!(leftIsObject && rightIsObject)) {
    out.push({ from: left, kind: "changed", path, to: right });
    return false;
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const keys = new Set([
    ...Object.keys(leftRecord),
    ...Object.keys(rightRecord),
  ]);
  for (const key of keys) {
    if (out.length >= MAX_ENTRIES) {
      return true;
    }
    const childPath = /^[A-Za-z_$][\w$]*$/.test(key)
      ? `${path}.${key}`
      : `${path}["${key}"]`;
    const hasLeft = key in leftRecord;
    const hasRight = key in rightRecord;
    if (hasLeft && !hasRight) {
      out.push({ from: leftRecord[key], kind: "removed", path: childPath });
      continue;
    }
    if (!hasLeft && hasRight) {
      out.push({ kind: "added", path: childPath, to: rightRecord[key] });
      continue;
    }
    if (diffValues(leftRecord[key], rightRecord[key], childPath, out)) {
      return true;
    }
  }
  return false;
}

function boundedText(text: string): string {
  return text.length > MAX_OUTPUT_CHARS
    ? `${text.slice(0, MAX_OUTPUT_CHARS)}\n… (sortie tronquée)`
    : text;
}

export const jsonToolbox = tool({
  description:
    "Boîte à outils JSON locale : valider un document (avec position de l'erreur), le formater ou le minifier, comparer deux JSON et lister les différences structurées, explorer tous les chemins d'accès. Aucun accès réseau, aucune donnée envoyée à l'extérieur.",
  execute: async (input) => {
    const parsed = parseJson(input.payload, "« payload »");
    if (!parsed.ok) {
      return { error: parsed.error, operation: input.operation };
    }

    if (input.operation === "validate") {
      return {
        depth: parsed.depth,
        operation: input.operation,
        size: input.payload.length,
        topLevelType: Array.isArray(parsed.value)
          ? "array"
          : parsed.value === null
            ? "null"
            : typeof parsed.value,
        valid: true,
      };
    }

    if (input.operation === "format" || input.operation === "minify") {
      const indent = Math.min(Math.max(input.indent ?? 2, 0), 8);
      const text =
        input.operation === "minify"
          ? JSON.stringify(parsed.value)
          : JSON.stringify(parsed.value, null, indent);
      return {
        operation: input.operation,
        result: boundedText(text),
        size: text.length,
      };
    }

    if (input.operation === "paths") {
      const entries: Array<{ path: string; type: string; value?: unknown }> =
        [];
      const truncated = collectPaths(parsed.value, "$", entries);
      return {
        entries,
        operation: input.operation,
        total: entries.length,
        truncated,
      };
    }

    // operation === "diff"
    if (typeof input.compareTo !== "string" || !input.compareTo.trim()) {
      return {
        error:
          "L'opération « diff » exige un second document JSON dans « compareTo ».",
        operation: input.operation,
      };
    }
    const compared = parseJson(input.compareTo, "« compareTo »");
    if (!compared.ok) {
      return { error: compared.error, operation: input.operation };
    }

    const differences: DiffEntry[] = [];
    const truncated = diffValues(
      parsed.value,
      compared.value,
      "$",
      differences
    );
    return {
      differences,
      identical: differences.length === 0,
      operation: input.operation,
      truncated,
    };
  },
  inputSchema: z.object({
    compareTo: z
      .string()
      .optional()
      .describe(
        "Second document JSON à comparer (obligatoire pour l'opération « diff »)"
      ),
    indent: z
      .number()
      .int()
      .min(0)
      .max(8)
      .optional()
      .describe("Indentation du formatage (0-8, défaut 2)"),
    operation: z
      .enum(["validate", "format", "minify", "diff", "paths"])
      .describe("Opération à effectuer sur le document JSON"),
    payload: z
      .string()
      .min(1)
      .max(MAX_PAYLOAD_CHARS)
      .describe("Document JSON à traiter (chaîne brute)"),
  }),
});

export const jsonToolboxPlugin: PluginDefinition = {
  createTools: () => ({ jsonToolbox }),
  manifest: manifest as PluginManifest,
};
