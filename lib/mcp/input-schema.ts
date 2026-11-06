// JSON Schema publié par un serveur MCP → schéma zod envoyé au modèle.
//
// Le serveur reste la source de vérité à l'exécution. Ici on conserve la
// structure (objets imbriqués, tableaux, contraintes, défauts, anyOf,
// oneOf, $ref locaux) pour qu'un petit modèle sache remplir les arguments.
// Un schéma incomplet ou inhabituel ne lève pas : une propriété sans
// `type` devient une union, un inconnu, ou un objet si elle a des
// propriétés — jamais un appel à `type.toLowerCase()`.

import { z } from "zod";
import { redactMcpText } from "./redaction";
import type { McpJsonSchema } from "./types";

const MAX_DEPTH = 8;
const MAX_PROPERTIES = 80;
const MAX_UNION = 32;
const DESCRIPTION_MAX = 500;
const PROPERTY_NAME = /^[A-Za-z_][A-Za-z0-9_-]{0,127}$/;
const FORMAT_NAME = /^[A-Za-z0-9_+.-]{1,64}$/;
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

// Formes de jetons réels. Le mot « token » seul n'en est pas un : un enum
// légitime ne doit pas être réécrit ni retiré.
const CREDENTIAL =
  /\b(?:gh[pousr]_[A-Za-z0-9._-]+|github_pat_[A-Za-z0-9._-]+|glpat-[A-Za-z0-9._-]+|xox[baprs]-[A-Za-z0-9._-]+|sk_(?:live|test)_[A-Za-z0-9._-]+|pat[A-Za-z0-9._-]{6,}|sbp_[A-Za-z0-9._-]+|AKIA[0-9A-Z]{16})\b|\bBearer\s+[A-Za-z0-9._~+/=-]{8,}|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}\.[A-Za-z0-9._-]{8,}\b/;

const NON_STRUCTURAL = new Set([
  "$ref",
  "$defs",
  "definitions",
  "default",
  "description",
  "examples",
  "format",
  "title",
]);

type ConvertContext = {
  depth: number;
  refStack: string[];
  root: McpJsonSchema;
  seen: WeakSet<object>;
};

function isSchema(value: unknown): value is McpJsonSchema {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nested(ctx: ConvertContext): ConvertContext {
  return { ...ctx, depth: ctx.depth + 1 };
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isCredentialValue(value: unknown): boolean {
  return typeof value === "string" && CREDENTIAL.test(value);
}

function renderDefault(value: unknown): string {
  if (isCredentialValue(value)) {
    return "";
  }
  let text = "";
  try {
    text = typeof value === "string" ? value : JSON.stringify(value);
  } catch {
    return "";
  }
  if (!text) {
    return "";
  }
  return redactMcpText(text, 120);
}

function unionOf(members: z.ZodTypeAny[]): z.ZodTypeAny {
  const limited = members.slice(0, MAX_UNION);
  if (limited.length === 0) {
    return z.unknown();
  }
  if (limited.length === 1) {
    return limited[0] ?? z.unknown();
  }
  return z.union(
    limited as unknown as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]
  );
}

function typeNames(node: McpJsonSchema): string[] {
  const value = node.type;
  if (typeof value === "string" && value.trim()) {
    return [value.trim().toLowerCase()];
  }
  if (!Array.isArray(value)) {
    return [];
  }
  const names: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && item.trim()) {
      names.push(item.trim().toLowerCase());
    }
  }
  return names;
}

function hasLookaround(pattern: string): boolean {
  let escaped = false;
  let inClass = false;
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (character === "[") {
      inClass = true;
      continue;
    }
    if (character === "]") {
      inClass = false;
      continue;
    }
    if (!inClass && character === "(" && pattern[index + 1] === "?") {
      const next = pattern[index + 2];
      if (next === "=" || next === "!") {
        return true;
      }
      if (
        next === "<" &&
        (pattern[index + 3] === "=" || pattern[index + 3] === "!")
      ) {
        return true;
      }
    }
  }
  return false;
}

function annotate(schema: z.ZodTypeAny, node: McpJsonSchema): z.ZodTypeAny {
  const parts: string[] = [];
  const current = schema.description?.trim();
  if (current) {
    parts.push(current);
  }
  if (typeof node.description === "string" && node.description.trim()) {
    parts.push(node.description.trim());
  }
  if (typeof node.format === "string" && FORMAT_NAME.test(node.format)) {
    parts.push(`format ${node.format}`);
  }
  if (parts.length === 0) {
    return schema;
  }
  const text = redactMcpText(parts.join(" "), DESCRIPTION_MAX).trim();
  if (!text || text === current) {
    return schema;
  }
  return schema.describe(text);
}

function withNote(schema: z.ZodTypeAny, note: string): z.ZodTypeAny {
  const extra = note.trim();
  if (!extra) {
    return schema;
  }
  const current = schema.description?.trim();
  const combined = current ? `${current} ${extra}` : extra;
  return schema.describe(redactMcpText(combined, DESCRIPTION_MAX));
}

function enumSchema(values: unknown[]): z.ZodTypeAny | null {
  const kept = values.filter((value) => !isCredentialValue(value));
  if (kept.length === 0) {
    return null;
  }
  if (kept.every((value) => typeof value === "string")) {
    return z.enum(kept as [string, ...string[]]);
  }
  const literals = kept.filter(
    (value): value is boolean | number | string | null =>
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
  );
  if (literals.length === 0) {
    return null;
  }
  return unionOf(literals.map((value) => literalOf(value)));
}

function literalOf(value: boolean | number | string | null): z.ZodTypeAny {
  if (value === null) {
    return z.null();
  }
  return z.literal(value);
}

function constSchema(value: unknown): z.ZodTypeAny {
  if (isCredentialValue(value)) {
    return z.unknown();
  }
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    if (value === null) {
      return z.null();
    }
    return z.literal(value);
  }
  const rendered = renderDefault(value);
  if (!rendered) {
    return z.unknown();
  }
  return z.unknown().describe(`const ${rendered}`);
}

function convertString(node: McpJsonSchema): z.ZodTypeAny {
  let schema = z.string();
  const minLength = finiteNumber(node.minLength);
  const maxLength = finiteNumber(node.maxLength);
  if (minLength !== null && minLength > 0) {
    schema = schema.min(minLength);
  }
  if (maxLength !== null && maxLength >= 0) {
    schema = schema.max(maxLength);
  }
  if (
    typeof node.pattern === "string" &&
    node.pattern.length > 0 &&
    node.pattern.length <= 300 &&
    !hasLookaround(node.pattern)
  ) {
    try {
      schema = schema.regex(new RegExp(node.pattern));
    } catch {
      // Motif illisible : le serveur MCP reste juge.
    }
  }
  return schema;
}

function convertNumber(node: McpJsonSchema, integer: boolean): z.ZodTypeAny {
  let schema = integer ? z.number().int() : z.number();
  const minimum = finiteNumber(node.minimum);
  const maximum = finiteNumber(node.maximum);
  const exclusiveMinimum = node.exclusiveMinimum;
  const exclusiveMaximum = node.exclusiveMaximum;
  if (
    typeof exclusiveMinimum === "number" &&
    Number.isFinite(exclusiveMinimum)
  ) {
    schema = schema.gt(exclusiveMinimum);
  } else if (exclusiveMinimum === true && minimum !== null) {
    schema = schema.gt(minimum);
  } else if (minimum !== null) {
    schema = schema.min(minimum);
  }
  if (
    typeof exclusiveMaximum === "number" &&
    Number.isFinite(exclusiveMaximum)
  ) {
    schema = schema.lt(exclusiveMaximum);
  } else if (exclusiveMaximum === true && maximum !== null) {
    schema = schema.lt(maximum);
  } else if (maximum !== null) {
    schema = schema.max(maximum);
  }
  const multipleOf = finiteNumber(node.multipleOf);
  if (multipleOf !== null && multipleOf > 0) {
    schema = schema.multipleOf(multipleOf);
  }
  return schema;
}

function convertArray(node: McpJsonSchema, ctx: ConvertContext): z.ZodTypeAny {
  const child = nested(ctx);
  if (Array.isArray(node.prefixItems) && node.prefixItems.length > 0) {
    const items = node.prefixItems.map((item) =>
      isSchema(item) ? convert(item, child) : z.unknown()
    ) as [z.ZodTypeAny, ...z.ZodTypeAny[]];
    if (isSchema(node.items)) {
      return z.tuple(items, convert(node.items, child));
    }
    return z.tuple(items);
  }
  if (Array.isArray(node.items) && node.items.length > 0) {
    const items = node.items.map((item) =>
      isSchema(item) ? convert(item, child) : z.unknown()
    ) as [z.ZodTypeAny, ...z.ZodTypeAny[]];
    return z.tuple(items);
  }
  const element = isSchema(node.items)
    ? convert(node.items, child)
    : z.unknown();
  let array = z.array(element);
  const minItems = finiteNumber(node.minItems);
  const maxItems = finiteNumber(node.maxItems);
  if (minItems !== null && minItems > 0 && Number.isInteger(minItems)) {
    array = array.min(minItems);
  }
  if (
    maxItems !== null &&
    maxItems >= 0 &&
    Number.isInteger(maxItems) &&
    (minItems === null || maxItems >= minItems)
  ) {
    array = array.max(maxItems);
  }
  return array;
}

function applyDefault(
  schema: z.ZodTypeAny,
  value: unknown,
  required: boolean
): z.ZodTypeAny {
  if (!usableDefault(value)) {
    return required ? schema : schema.optional();
  }
  const rendered = renderDefault(value);
  if (required) {
    return rendered ? withNote(schema, `Défaut : ${rendered}`) : schema;
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const noted = rendered ? withNote(schema, `Défaut : ${rendered}`) : schema;
    return noted.optional();
  }
  try {
    return schema.default(parsed.data as never);
  } catch {
    const noted = rendered ? withNote(schema, `Défaut : ${rendered}`) : schema;
    return noted.optional();
  }
}

function usableDefault(value: unknown): boolean {
  return value !== undefined && !isCredentialValue(value);
}

function convertObject(node: McpJsonSchema, ctx: ConvertContext): z.ZodTypeAny {
  const required = new Set(
    (node.required ?? []).filter(
      (name): name is string => typeof name === "string"
    )
  );
  const shape: Record<string, z.ZodTypeAny> = {};
  const entries = Object.entries(node.properties ?? {}).slice(
    0,
    MAX_PROPERTIES
  );
  for (const [name, property] of entries) {
    if (!PROPERTY_NAME.test(name) || FORBIDDEN_KEYS.has(name)) {
      continue;
    }
    if (!isSchema(property)) {
      continue;
    }
    const converted = applyDefault(
      convert(property, nested(ctx)),
      property.default,
      required.has(name)
    );
    shape[name] = converted;
  }
  const extra = node.additionalProperties;
  if (extra === true) {
    return z.object(shape).catchall(z.unknown());
  }
  if (isSchema(extra)) {
    return z.object(shape).catchall(convert(extra, nested(ctx)));
  }
  return z.object(shape).strict();
}

function isLocalRef(ref: string): boolean {
  return ref.startsWith("#/$defs/") || ref.startsWith("#/definitions/");
}

function resolveRef(ref: string, root: McpJsonSchema): McpJsonSchema | null {
  const match = /^#\/(\$defs|definitions)\/(.+)$/.exec(ref);
  if (!match) {
    return null;
  }
  const bucket = match[1];
  const encoded = match[2];
  if (!bucket || encoded === undefined) {
    return null;
  }
  const name = encoded.replace(/~1/g, "/").replace(/~0/g, "~");
  const table = bucket === "$defs" ? root.$defs : root.definitions;
  const found = table?.[name];
  return isSchema(found) ? found : null;
}

function convertRef(ref: string, ctx: ConvertContext): z.ZodTypeAny {
  if (!isLocalRef(ref)) {
    return z.unknown().describe("Référence externe non résolue");
  }
  if (ctx.refStack.includes(ref)) {
    return z.unknown().describe("Référence circulaire");
  }
  const target = resolveRef(ref, ctx.root);
  if (!target) {
    return z.unknown().describe("Référence locale introuvable");
  }
  ctx.refStack.push(ref);
  try {
    return convert(target, nested(ctx));
  } finally {
    ctx.refStack.pop();
  }
}

function hasStructuralSiblings(node: McpJsonSchema): boolean {
  return Object.keys(node).some((key) => !NON_STRUCTURAL.has(key));
}

function isObjectNode(
  node: McpJsonSchema,
  ctx: ConvertContext,
  seen: Set<string>
): boolean {
  if (typeof node.$ref === "string") {
    if (seen.has(node.$ref)) {
      return false;
    }
    const target = isLocalRef(node.$ref)
      ? resolveRef(node.$ref, ctx.root)
      : null;
    if (!target) {
      return false;
    }
    seen.add(node.$ref);
    return isObjectNode(target, ctx, seen);
  }
  if (node.anyOf || node.oneOf) {
    return false;
  }
  if (Array.isArray(node.allOf)) {
    return node.allOf.every(
      (branch) => isSchema(branch) && isObjectNode(branch, ctx, seen)
    );
  }
  const names = typeNames(node);
  if (names.length === 1 && names[0] === "object") {
    return true;
  }
  return (
    names.length === 0 &&
    Boolean(node.properties) &&
    !node.items &&
    !node.prefixItems
  );
}

function mergeObjectBranches(
  schemas: McpJsonSchema[],
  ctx: ConvertContext
): McpJsonSchema | null {
  const properties: Record<string, McpJsonSchema> = {};
  const required: string[] = [];
  let additional: boolean | McpJsonSchema | undefined;
  const seen = new Set<string>();
  const visit = (node: McpJsonSchema): boolean => {
    if (typeof node.$ref === "string") {
      if (!isLocalRef(node.$ref) || seen.has(node.$ref)) {
        return false;
      }
      seen.add(node.$ref);
      const target = resolveRef(node.$ref, ctx.root);
      return Boolean(target && visit(target));
    }
    if (node.anyOf || node.oneOf) {
      return false;
    }
    if (Array.isArray(node.allOf)) {
      return node.allOf.every((branch) => isSchema(branch) && visit(branch));
    }
    if (!isObjectNode(node, ctx, new Set())) {
      return false;
    }
    for (const [key, value] of Object.entries(node.properties ?? {})) {
      if (isSchema(value)) {
        properties[key] = value;
      }
    }
    for (const name of node.required ?? []) {
      if (typeof name === "string" && !required.includes(name)) {
        required.push(name);
      }
    }
    if (node.additionalProperties !== undefined) {
      additional = node.additionalProperties;
    }
    return true;
  };
  if (!schemas.every((branch) => visit(branch))) {
    return null;
  }
  return {
    ...(additional === undefined ? {} : { additionalProperties: additional }),
    properties,
    required,
    type: "object",
  };
}

function convertComposition(
  keyword: "allOf" | "anyOf" | "oneOf",
  branches: McpJsonSchema[] | undefined,
  ctx: ConvertContext
): z.ZodTypeAny | null {
  if (!Array.isArray(branches) || branches.length === 0) {
    return null;
  }
  const schemas = branches.filter(isSchema);
  if (schemas.length === 0) {
    return null;
  }
  if (keyword === "allOf") {
    const merged = mergeObjectBranches(schemas, ctx);
    if (!merged) {
      return z.unknown().describe("combinaison allOf non représentée");
    }
    // Une intersection de deux objets fermés refuserait les propriétés de
    // l'autre branche. On les réunit dans un seul objet.
    return convertObject(merged, ctx);
  }
  // oneOf est exclusif dans JSON Schema. zod exprime une union : le modèle
  // voit les branches, le serveur MCP tranche à l'appel.
  return unionOf(schemas.map((branch) => convert(branch, nested(ctx))));
}

function convertSingleType(
  name: string,
  node: McpJsonSchema,
  ctx: ConvertContext
): z.ZodTypeAny {
  switch (name) {
    case "string":
      return convertString(node);
    case "integer":
      return convertNumber(node, true);
    case "number":
      return convertNumber(node, false);
    case "boolean":
      return z.boolean();
    case "null":
      return z.null();
    case "array":
      return convertArray(node, ctx);
    case "object":
      return convertObject(node, ctx);
    default:
      return z.unknown();
  }
}

function convertTypes(
  names: string[],
  node: McpJsonSchema,
  ctx: ConvertContext
): z.ZodTypeAny | null {
  if (names.length === 0) {
    return null;
  }
  const nullable = names.includes("null");
  const concrete = names.filter((name) => name !== "null");
  if (concrete.length === 0) {
    return z.null();
  }
  const schema = unionOf(
    concrete.map((name) => convertSingleType(name, node, ctx))
  );
  return nullable ? schema.nullable() : schema;
}

function convertCore(node: McpJsonSchema, ctx: ConvertContext): z.ZodTypeAny {
  if (ctx.depth >= MAX_DEPTH) {
    return z.unknown();
  }
  const ref = typeof node.$ref === "string" ? node.$ref : undefined;
  if (ref && !hasStructuralSiblings(node)) {
    return convertRef(ref, ctx);
  }
  if (ref) {
    const { $ref: _ref, ...rest } = node;
    return z.intersection(convertRef(ref, ctx), convert(rest, nested(ctx)));
  }
  const allOf = convertComposition("allOf", node.allOf, ctx);
  if (allOf) {
    return allOf;
  }
  const anyOf = convertComposition("anyOf", node.anyOf, ctx);
  if (anyOf) {
    return anyOf;
  }
  const oneOf = convertComposition("oneOf", node.oneOf, ctx);
  if (oneOf) {
    return oneOf;
  }
  if (Array.isArray(node.enum) && node.enum.length > 0) {
    const enumerated = enumSchema(node.enum);
    if (enumerated) {
      return enumerated;
    }
  }
  if ("const" in node && node.const !== undefined) {
    return constSchema(node.const);
  }
  const named = convertTypes(typeNames(node), node, ctx);
  if (named) {
    return named;
  }
  if (node.properties) {
    return convertObject(node, ctx);
  }
  if (node.items || node.prefixItems) {
    return convertArray(node, ctx);
  }
  return z.unknown();
}

function convert(node: McpJsonSchema, ctx: ConvertContext): z.ZodTypeAny {
  if (ctx.depth >= MAX_DEPTH) {
    return z.unknown();
  }
  if (ctx.seen.has(node)) {
    return z.unknown().describe("Référence circulaire");
  }
  ctx.seen.add(node);
  try {
    return annotate(convertCore(node, ctx), node);
  } finally {
    ctx.seen.delete(node);
  }
}

/** Schéma d'arguments d'un outil MCP. Sans contrat, objet ouvert. */
export function jsonSchemaToZod(schema: unknown): z.ZodTypeAny {
  if (!isSchema(schema)) {
    return z.object({}).catchall(z.unknown());
  }
  return convert(schema, {
    depth: 0,
    refStack: [],
    root: schema,
    seen: new WeakSet(),
  });
}
