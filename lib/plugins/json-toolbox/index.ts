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
const MAX_STATS_NODES = 100_000;

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

function childPath(path: string, key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}["${key}"]`;
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
      if (collectPaths(child, childPath(prefix, key), out)) {
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
    const child = childPath(path, key);
    const hasLeft = key in leftRecord;
    const hasRight = key in rightRecord;
    if (hasLeft && !hasRight) {
      out.push({ from: leftRecord[key], kind: "removed", path: child });
      continue;
    }
    if (!hasLeft && hasRight) {
      out.push({ kind: "added", path: child, to: rightRecord[key] });
      continue;
    }
    if (diffValues(leftRecord[key], rightRecord[key], child, out)) {
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

// ── Opérations d'exploration (locales) ──────────────────────────────────────

/**
 * Résout un chemin d'accès. Deux écritures acceptées : le point/indice déjà
 * produit par l'opération « paths» (`a.b[0]`, `a["x y"]`) et le JSON Pointer
 * standard (`/a/b/0`). Sans cela le modèle ne peut pas cibler une valeur sans
 * re-fournir le document entier.
 */
function resolvePath(
  root: unknown,
  rawPath: string
): { found: boolean; value?: unknown } {
  const trimmed = rawPath.trim();
  if (!trimmed) {
    return { found: false };
  }

  if (trimmed.startsWith("/")) {
    let current: unknown = root;
    for (const rawSegment of trimmed.slice(1).split("/")) {
      const segment = rawSegment.replaceAll("~1", "/").replaceAll("~0", "~");
      if (Array.isArray(current)) {
        const index = Number(segment);
        if (!Number.isInteger(index) || index < 0 || index >= current.length) {
          return { found: false };
        }
        current = current[index];
        continue;
      }
      if (current === null || typeof current !== "object") {
        return { found: false };
      }
      const record = current as Record<string, unknown>;
      if (!(segment in record)) {
        return { found: false };
      }
      current = record[segment];
    }
    return { found: true, value: current };
  }

  const segments = trimmed
    .replace(/^\$\.?/, "")
    .replace(/\["([^"]*)"\]/g, ".$1")
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);

  let current: unknown = root;
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return { found: false };
      }
      current = current[index];
      continue;
    }
    if (current === null || typeof current !== "object") {
      return { found: false };
    }
    const record = current as Record<string, unknown>;
    if (!(segment in record)) {
      return { found: false };
    }
    current = record[segment];
  }
  return { found: true, value: current };
}

// Le séparateur est capturé par une fabrique plutôt que repassé en paramètre à
// chaque appel récursif : il ne change jamais pendant l'aplatissement.
function createFlattener(separator: string) {
  return function flatten(
    value: unknown,
    prefix: string,
    out: Record<string, unknown>
  ): boolean {
    if (Object.keys(out).length >= MAX_ENTRIES) {
      return true;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        out[prefix] = [];
        return false;
      }
      for (const [index, item] of value.entries()) {
        if (flatten(item, `${prefix}${separator}${index}`, out)) {
          return true;
        }
      }
      return false;
    }
    if (value !== null && typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) {
        out[prefix] = {};
        return false;
      }
      for (const [key, child] of entries) {
        if (flatten(child, `${prefix}${separator}${key}`, out)) {
          return true;
        }
      }
      return false;
    }
    out[prefix] = value;
    return false;
  };
}

type MergeStrategy = "concat" | "deep" | "replace";

function mergeValues(
  base: unknown,
  patch: unknown,
  strategy: MergeStrategy
): unknown {
  if (Array.isArray(base) && Array.isArray(patch)) {
    return strategy === "concat" ? [...base, ...patch] : patch;
  }
  if (
    strategy === "deep" &&
    base !== null &&
    patch !== null &&
    typeof base === "object" &&
    typeof patch === "object" &&
    !Array.isArray(base) &&
    !Array.isArray(patch)
  ) {
    const merged: Record<string, unknown> = {
      ...(base as Record<string, unknown>),
    };
    for (const [key, value] of Object.entries(
      patch as Record<string, unknown>
    )) {
      merged[key] =
        key in merged ? mergeValues(merged[key], value, strategy) : value;
    }
    return merged;
  }
  return patch;
}

type StatsAccumulator = {
  arrayLengths: { length: number; path: string }[];
  booleanCount: number;
  keyFrequency: Map<string, number>;
  maxDepth: number;
  maxKeyLength: number;
  nullCount: number;
  nodeCount: number;
  numeric: { count: number; max: number; min: number; sum: number };
  stringLengths: { count: number; max: number; total: number };
  types: Record<string, number>;
};

function newAccumulator(): StatsAccumulator {
  return {
    arrayLengths: [],
    booleanCount: 0,
    keyFrequency: new Map(),
    maxDepth: 0,
    maxKeyLength: 0,
    nodeCount: 0,
    nullCount: 0,
    numeric: {
      count: 0,
      max: Number.NEGATIVE_INFINITY,
      min: Number.POSITIVE_INFINITY,
      sum: 0,
    },
    stringLengths: { count: 0, max: 0, total: 0 },
    types: {},
  };
}

function accumulate(
  value: unknown,
  path: string,
  depth: number,
  acc: StatsAccumulator
): void {
  if (acc.nodeCount >= MAX_STATS_NODES) {
    return;
  }
  acc.nodeCount += 1;
  acc.maxDepth = Math.max(acc.maxDepth, depth);

  if (value === null) {
    acc.nullCount += 1;
    acc.types.null = (acc.types.null ?? 0) + 1;
    return;
  }
  if (Array.isArray(value)) {
    acc.types.array = (acc.types.array ?? 0) + 1;
    if (acc.arrayLengths.length < 50) {
      acc.arrayLengths.push({ length: value.length, path });
    }
    for (const [index, item] of value.entries()) {
      accumulate(item, `${path}[${index}]`, depth + 1, acc);
    }
    return;
  }
  const kind = typeof value;
  acc.types[kind] = (acc.types[kind] ?? 0) + 1;
  if (kind === "number") {
    const numeric = value as number;
    if (Number.isFinite(numeric)) {
      acc.numeric.count += 1;
      acc.numeric.max = Math.max(acc.numeric.max, numeric);
      acc.numeric.min = Math.min(acc.numeric.min, numeric);
      acc.numeric.sum += numeric;
    }
    return;
  }
  if (kind === "string") {
    const text = value as string;
    acc.stringLengths.count += 1;
    acc.stringLengths.max = Math.max(acc.stringLengths.max, text.length);
    acc.stringLengths.total += text.length;
    return;
  }
  if (kind === "boolean") {
    acc.booleanCount += 1;
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    acc.keyFrequency.set(key, (acc.keyFrequency.get(key) ?? 0) + 1);
    acc.maxKeyLength = Math.max(acc.maxKeyLength, key.length);
    accumulate(child, childPath(path, key), depth + 1, acc);
  }
}

function buildStats(value: unknown) {
  const acc = newAccumulator();
  accumulate(value, "$", 1, acc);
  const { numeric, stringLengths } = acc;
  return {
    arrays: {
      largest: [...acc.arrayLengths]
        .sort((left, right) => right.length - left.length)
        .slice(0, 5),
      total: acc.arrayLengths.length,
    },
    booleans: acc.booleanCount,
    depth: acc.maxDepth,
    keys: {
      distinct: acc.keyFrequency.size,
      longest: acc.maxKeyLength,
      mostFrequent: [...acc.keyFrequency.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 10)
        .map(([key, count]) => ({ count, key })),
    },
    nodes: acc.nodeCount,
    nulls: acc.nullCount,
    numbers:
      numeric.count > 0
        ? {
            count: numeric.count,
            max: numeric.max,
            mean: Number((numeric.sum / numeric.count).toFixed(3)),
            min: numeric.min,
            sum: Number(numeric.sum.toFixed(6)),
          }
        : null,
    strings:
      stringLengths.count > 0
        ? {
            averageLength: Math.round(
              stringLengths.total / stringLengths.count
            ),
            count: stringLengths.count,
            maxLength: stringLengths.max,
            totalLength: stringLengths.total,
          }
        : null,
    truncated: acc.nodeCount >= MAX_STATS_NODES,
    types: acc.types,
  };
}

export const jsonToolbox = tool({
  description:
    "Boîte à outils JSON locale : valider un document (avec position de l'erreur), le formater ou le minifier, comparer deux JSON et lister les différences structurées, explorer tous les chemins d'accès, extraire une valeur à un chemin, aplatir en paires clé/valeur, fusionner deux documents, projeter une sélection de chemins ou établir une statistique descriptive (types, profondeur, numérique, chaînes). Aucun accès réseau, aucune donnée envoyée à l'extérieur.",
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

    if (input.operation === "get") {
      if (typeof input.path !== "string" || !input.path.trim()) {
        return {
          error:
            "L'opération « get » exige un chemin dans « path » (ex: « a.b[0] » ou « /a/b/0 »).",
          operation: input.operation,
        };
      }
      const resolved = resolvePath(parsed.value, input.path);
      return {
        found: resolved.found,
        operation: input.operation,
        path: input.path,
        result: resolved.found ? resolved.value : null,
        ...(resolved.found
          ? {
              type: Array.isArray(resolved.value)
                ? "array"
                : resolved.value === null
                  ? "null"
                  : typeof resolved.value,
            }
          : {}),
      };
    }

    if (input.operation === "flatten") {
      const separator = input.separator === "." ? "." : "/";
      const flat: Record<string, unknown> = {};
      const truncated = createFlattener(separator)(parsed.value, "$", flat);
      return {
        entries: flat,
        operation: input.operation,
        separator,
        total: Object.keys(flat).length,
        truncated,
      };
    }

    if (input.operation === "merge") {
      if (typeof input.compareTo !== "string" || !input.compareTo.trim()) {
        return {
          error:
            "L'opération « merge » exige le document à fusionner dans « compareTo ».",
          operation: input.operation,
        };
      }
      const merged = parseJson(input.compareTo, "« compareTo »");
      if (!merged.ok) {
        return { error: merged.error, operation: input.operation };
      }
      const strategy: MergeStrategy =
        input.strategy === "deep" ||
        input.strategy === "replace" ||
        input.strategy === "concat"
          ? input.strategy
          : "deep";
      const result = mergeValues(parsed.value, merged.value, strategy);
      const text = JSON.stringify(result, null, 2);
      return {
        operation: input.operation,
        result: boundedText(text),
        size: text.length,
        strategy,
      };
    }

    if (input.operation === "pick") {
      const paths = (input.paths ?? []).filter(
        (entry) => entry.trim().length > 0
      );
      if (paths.length === 0) {
        return {
          error:
            "L'opération « pick » exige au moins un chemin dans « paths ».",
          operation: input.operation,
        };
      }
      const projection: Record<string, unknown> = {};
      const missing: string[] = [];
      for (const path of paths) {
        const resolved = resolvePath(parsed.value, path);
        if (resolved.found) {
          projection[path] = resolved.value;
        } else {
          missing.push(path);
        }
      }
      return {
        found: Object.keys(projection).length,
        missing,
        operation: input.operation,
        selected: projection,
        total: paths.length,
      };
    }

    if (input.operation === "stats") {
      return {
        operation: input.operation,
        size: input.payload.length,
        stats: buildStats(parsed.value),
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
        "Second document JSON : obligatoire pour « diff », document à fusionner pour « merge »"
      ),
    indent: z
      .number()
      .int()
      .min(0)
      .max(8)
      .optional()
      .describe("Indentation du formatage (0-8, défaut 2)"),
    operation: z
      .enum([
        "validate",
        "format",
        "minify",
        "diff",
        "paths",
        "get",
        "flatten",
        "merge",
        "pick",
        "stats",
      ])
      .describe("Opération à effectuer sur le document JSON"),
    path: z
      .string()
      .max(500)
      .optional()
      .describe(
        "Chemin ciblé pour « get » (ex: « a.b[0] ») ou JSON Pointer (ex: « /a/b/0 »)"
      ),
    paths: z
      .array(z.string().min(1).max(500))
      .max(MAX_ENTRIES)
      .optional()
      .describe("Chemins à projeter pour « pick »"),
    payload: z
      .string()
      .min(1)
      .max(MAX_PAYLOAD_CHARS)
      .describe("Document JSON à traiter (chaîne brute)"),
    separator: z
      .enum([".", "/"])
      .optional()
      .describe("Séparateur des clés aplaties pour « flatten » (défaut « / »)"),
    strategy: z
      .enum(["deep", "replace", "concat"])
      .optional()
      .describe(
        "Stratégie de « merge » : deep (défaut), replace (écrase), concat (concatène les tableaux)"
      ),
  }),
});

export const jsonToolboxPlugin: PluginDefinition = {
  createTools: () => ({ jsonToolbox }),
  manifest: manifest as PluginManifest,
};
