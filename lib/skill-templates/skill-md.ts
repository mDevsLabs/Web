import type { SkillTemplateManifest, SkillTemplateParameter } from "./types";
import {
  canonicalMcpServerName,
  validateSkillTemplateManifest,
} from "./validation";

/** Limite défensive : un SKILL.md local ne doit pas devenir un archive. */
export const MAX_SKILL_MARKDOWN_LENGTH = 100_000;

/** Clés de frontmatter acceptées par le convertisseur local. */
export const SKILL_MARKDOWN_FRONTMATTER_KEYS = [
  "id",
  "name",
  "description",
  "author",
  "category",
  "tags",
  "minTier",
  "tools",
  "allowed-tools",
  "pluginIds",
  "plugins",
  "mcpServerNames",
  "mcp-servers",
  "mcpServers",
  "parameters",
  "icon",
  "color",
] as const;

const FRONTMATTER_KEY_SET = new Set<string>(SKILL_MARKDOWN_FRONTMATTER_KEYS);
const FRONTMATTER_KEY_BY_LOWER = new Map(
  SKILL_MARKDOWN_FRONTMATTER_KEYS.map((key) => [key.toLowerCase(), key])
);
const UNSUPPORTED_KEYS = new Set([
  "script",
  "scripts",
  "resource",
  "resources",
  "files",
  "hooks",
  "commands",
  "agents",
  "metadata",
]);

export type SkillMarkdownErrorCode =
  | "invalid_source"
  | "missing_frontmatter"
  | "invalid_frontmatter"
  | "unsupported_frontmatter"
  | "invalid_field"
  | "missing_name"
  | "empty_instructions"
  | "invalid_manifest";

export class SkillMarkdownError extends Error {
  readonly code: SkillMarkdownErrorCode;
  readonly field?: string;

  constructor(code: SkillMarkdownErrorCode, message: string, field?: string) {
    super(message);
    this.name = "SkillMarkdownError";
    this.code = code;
    this.field = field;
  }
}

export type SkillMarkdownFrontmatter = {
  id?: string;
  name: string;
  description?: string;
  author?: string;
  category?: string;
  tags?: string[];
  minTier?: "free" | "plus" | "pro" | "max";
  tools?: string[];
  pluginIds?: string[];
  mcpServerNames?: string[];
  parameters?: SkillTemplateParameter[];
  icon?: string;
  color?: string;
};

/** Résultat de bas niveau : les deux champs utiles sont instructions et body. */
export type ParsedSkillMarkdown = {
  frontmatter: SkillMarkdownFrontmatter;
  body: string;
  instructions: string;
};

export type SkillMarkdownParseSuccess = {
  ok: true;
  value: ParsedSkillMarkdown;
};

export type SkillMarkdownParseFailure = {
  ok: false;
  error: {
    code: SkillMarkdownErrorCode;
    field?: string;
    message: string;
  };
};

export type SkillMarkdownParseResult =
  | SkillMarkdownParseSuccess
  | SkillMarkdownParseFailure;

export type SkillMarkdownConversionSuccess = {
  ok: true;
  value: SkillTemplateManifest;
};

export type SkillMarkdownConversionFailure = {
  ok: false;
  error: {
    code: SkillMarkdownErrorCode;
    field?: string;
    message: string;
  };
};

export type SkillMarkdownConversionResult =
  | SkillMarkdownConversionSuccess
  | SkillMarkdownConversionFailure;

export type ConvertSkillMarkdownOptions = {
  /** Surcharge le slug déduit de `name`, sans toucher au fichier source. */
  id?: string;
  /** Désactive uniquement la validation des dépendances (parsing inchangé). */
  validate?: boolean;
};

function fail(
  code: SkillMarkdownErrorCode,
  message: string,
  field?: string
): never {
  throw new SkillMarkdownError(code, message, field);
}

function normalizeLines(source: string): string[] {
  return source
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 2) return trimmed;
  const first = trimmed[0];
  const last = trimmed.at(-1);
  if ((first !== '"' && first !== "'") || first !== last) return trimmed;
  const inner = trimmed.slice(1, -1);
  return inner.replace(/\\([\\"'])/g, "$1").replace(/\\n/g, "\n");
}

function splitInlineValues(value: string): string[] {
  const input = value.trim();
  const values: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (const character of input) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === "\\" && quote) {
      current += character;
      escaped = true;
      continue;
    }
    if (
      (character === '"' || character === "'") &&
      (!quote || quote === character)
    ) {
      quote = quote ? null : character;
      current += character;
      continue;
    }
    if (character === "," && !quote) {
      values.push(current);
      current = "";
      continue;
    }
    current += character;
  }
  values.push(current);
  return values.map((item) => unquote(item).trim()).filter(Boolean);
}

function parseScalar(value: string): string | number | boolean | null {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null" || trimmed === "~") return null;
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) {
    const number = Number(trimmed);
    if (Number.isFinite(number)) return number;
  }
  return unquote(trimmed);
}

function parseList(value: string): string[] {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return splitInlineValues(trimmed.slice(1, -1));
  }
  // La syntaxe SKILL.md la plus répandue accepte une liste séparée par des
  // virgules ; on refuse toutefois les objets imbriqués.
  if (trimmed.startsWith("{")) {
    fail("invalid_field", `valeur objet non prise en charge : ${trimmed}`);
  }
  return splitInlineValues(trimmed);
}

function isListLine(line: string): boolean {
  return /^\s*-\s+/.test(line);
}

function indentationOf(line: string): number {
  return line.match(/^\s*/)?.[0].length ?? 0;
}

function collectIndentedLines(
  lines: string[],
  start: number
): { lines: string[]; nextIndex: number } {
  const first = lines[start];
  if (!first) return { lines: [], nextIndex: start };
  const indentation = indentationOf(first);
  const collected: string[] = [];
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      collected.push("");
      index += 1;
      continue;
    }
    if (indentationOf(line) <= indentation) break;
    collected.push(line.slice(indentation));
    index += 1;
  }
  while (collected.at(-1) === "") collected.pop();
  return { lines: collected, nextIndex: index };
}

function collectListLines(
  lines: string[],
  start: number
): { values: string[]; nextIndex: number } {
  const values: string[] = [];
  let index = start;
  while (index < lines.length && isListLine(lines[index])) {
    values.push(unquote(lines[index].replace(/^\s*-\s+/, "").trim()));
    index += 1;
  }
  return { nextIndex: index, values };
}

function parseParameterValue(key: string, value: string): unknown {
  if (key === "enumValues") return parseList(value);
  return parseScalar(value);
}

function collectParameterBlock(
  lines: string[],
  start: number
): { entries: Record<string, unknown>[]; nextIndex: number } {
  const entries: Record<string, unknown>[] = [];
  let index = start;
  while (index < lines.length && isListLine(lines[index])) {
    const listLine = lines[index];
    const listIndentation = indentationOf(listLine);
    const first = listLine.replace(/^\s*-\s+/, "").trim();
    const firstMatch = first.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!firstMatch) {
      fail("invalid_field", `paramètre YAML invalide : ${first}`, "parameters");
    }
    const entry: Record<string, unknown> = {};
    entry[firstMatch[1]] = parseParameterValue(firstMatch[1], firstMatch[2]);
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      indentationOf(lines[index]) > listIndentation
    ) {
      const continuation = lines[index].trim();
      const continuationMatch = continuation.match(
        /^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/
      );
      if (!continuationMatch) {
        fail(
          "invalid_field",
          `propriété de paramètre invalide : ${continuation}`,
          "parameters"
        );
      }
      entry[continuationMatch[1]] = parseParameterValue(
        continuationMatch[1],
        continuationMatch[2]
      );
      index += 1;
    }
    entries.push(entry);
  }
  return { entries, nextIndex: index };
}

function parseParameterList(value: string): SkillTemplateParameter[] {
  const trimmed = value.trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    fail(
      "invalid_field",
      "parameters doit être un tableau JSON d'objets simples"
    );
  }
  if (!Array.isArray(parsed)) {
    fail("invalid_field", "parameters doit être un tableau");
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      fail("invalid_field", `paramètre ${index + 1} invalide`, "parameters");
    }
    const value = entry as Record<string, unknown>;
    const allowed = new Set([
      "name",
      "description",
      "type",
      "required",
      "defaultValue",
      "enumValues",
    ]);
    for (const key of Object.keys(value)) {
      if (!allowed.has(key)) {
        fail(
          "unsupported_frontmatter",
          `champ de paramètre non pris en charge : ${key}`,
          "parameters"
        );
      }
    }
    if (typeof value.name !== "string" || !value.name.trim()) {
      fail("invalid_field", `paramètre ${index + 1} sans nom`, "parameters");
    }
    if (
      value.description !== undefined &&
      typeof value.description !== "string"
    ) {
      fail(
        "invalid_field",
        `description invalide pour ${value.name}`,
        "parameters"
      );
    }
    if (value.required !== undefined && typeof value.required !== "boolean") {
      fail(
        "invalid_field",
        `required invalide pour ${value.name}`,
        "parameters"
      );
    }
    if (value.type !== undefined && typeof value.type !== "string") {
      fail("invalid_field", `type invalide pour ${value.name}`, "parameters");
    }
    if (
      value.defaultValue !== undefined &&
      typeof value.defaultValue !== "string"
    ) {
      fail(
        "invalid_field",
        `defaultValue doit être une chaîne pour ${value.name}`,
        "parameters"
      );
    }
    if (
      value.enumValues !== undefined &&
      (!Array.isArray(value.enumValues) ||
        value.enumValues.some((item) => typeof item !== "string"))
    ) {
      fail(
        "invalid_field",
        `enumValues doit être une liste de chaînes pour ${value.name}`,
        "parameters"
      );
    }
    const parameter: SkillTemplateParameter = {
      name: value.name.trim(),
    };
    if (value.defaultValue !== undefined) {
      parameter.defaultValue = value.defaultValue as string;
    }
    if (value.description !== undefined) {
      parameter.description = value.description as string;
    }
    if (value.enumValues !== undefined) {
      parameter.enumValues = value.enumValues as string[];
    }
    if (value.required !== undefined) {
      parameter.required = value.required as boolean;
    }
    if (value.type !== undefined) {
      parameter.type = value.type as string;
    }
    return parameter;
  });
}

function parseFrontmatterValue(key: string, value: string): unknown {
  if (
    key === "name" ||
    key === "id" ||
    key === "description" ||
    key === "author" ||
    key === "category" ||
    key === "icon" ||
    key === "color"
  ) {
    if (typeof parseScalar(value) !== "string") {
      fail("invalid_field", `${key} doit être une chaîne`, key);
    }
    return String(parseScalar(value)).trim();
  }
  if (key === "minTier") {
    const tier = String(parseScalar(value)).trim();
    if (!["free", "plus", "pro", "max"].includes(tier)) {
      fail("invalid_field", `forfait inconnu : ${tier}`, key);
    }
    return tier as SkillMarkdownFrontmatter["minTier"];
  }
  if (
    key === "tags" ||
    key === "tools" ||
    key === "allowed-tools" ||
    key === "pluginIds" ||
    key === "plugins" ||
    key === "mcpServerNames" ||
    key === "mcp-servers" ||
    key === "mcpServers"
  ) {
    return parseList(value);
  }
  if (key === "parameters") return parseParameterList(value);
  return parseScalar(value) as string | number | boolean | null;
}

function assignFrontmatterValue(
  frontmatter: SkillMarkdownFrontmatter,
  key: string,
  value: unknown
): void {
  switch (key) {
    case "id":
      frontmatter.id = value as string;
      return;
    case "name":
      frontmatter.name = value as string;
      return;
    case "description":
      frontmatter.description = value as string;
      return;
    case "author":
      frontmatter.author = value as string;
      return;
    case "category":
      frontmatter.category = value as string;
      return;
    case "icon":
      frontmatter.icon = value as string;
      return;
    case "color":
      frontmatter.color = value as string;
      return;
    case "minTier":
      frontmatter.minTier = value as SkillMarkdownFrontmatter["minTier"];
      return;
    case "tags":
      frontmatter.tags = value as string[];
      return;
    case "tools":
    case "allowed-tools":
      frontmatter.tools = value as string[];
      return;
    case "pluginIds":
    case "plugins":
      frontmatter.pluginIds = value as string[];
      return;
    case "mcpServerNames":
    case "mcp-servers":
    case "mcpServers":
      frontmatter.mcpServerNames = value as string[];
      return;
    case "parameters":
      frontmatter.parameters = value as SkillTemplateParameter[];
      return;
    default:
      fail("unsupported_frontmatter", `champ non pris en charge : ${key}`);
  }
}

function parseFrontmatter(lines: string[]): SkillMarkdownFrontmatter {
  const frontmatter: SkillMarkdownFrontmatter = { name: "" };
  const seenKeys = new Set<string>();
  let index = 0;
  let sawName = false;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim() || /^\s*#/.test(line)) {
      index += 1;
      continue;
    }
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!match) {
      fail("invalid_frontmatter", `ligne de frontmatter invalide : ${line}`);
    }
    const rawKey = match[1];
    const lowerKey = rawKey.toLowerCase();
    if (UNSUPPORTED_KEYS.has(lowerKey)) {
      fail(
        "unsupported_frontmatter",
        `le champ ${rawKey} n'est pas autorisé : scripts et ressources ne sont pas importés`,
        rawKey
      );
    }
    const key = FRONTMATTER_KEY_BY_LOWER.get(lowerKey) ?? rawKey;
    if (!FRONTMATTER_KEY_SET.has(key)) {
      fail(
        "unsupported_frontmatter",
        `champ non pris en charge : ${rawKey}`,
        rawKey
      );
    }
    if (seenKeys.has(key)) {
      fail("invalid_frontmatter", `champ dupliqué : ${key}`, key);
    }
    seenKeys.add(key);

    let rawValue = match[2].trim();
    if (
      key === "parameters" &&
      rawValue === "" &&
      isListLine(lines[index + 1] ?? "")
    ) {
      const block = collectParameterBlock(lines, index + 1);
      frontmatter.parameters = parseParameterList(
        JSON.stringify(block.entries)
      );
      index = block.nextIndex - 1;
    } else {
      if (
        rawValue === "|" ||
        rawValue === ">" ||
        /^[|>][-+]?$/.test(rawValue)
      ) {
        const block = collectIndentedLines(lines, index + 1);
        const separator = rawValue.startsWith(">") ? " " : "\n";
        rawValue = block.lines.join(separator);
        index = block.nextIndex - 1;
      } else if (rawValue === "" && isListLine(lines[index + 1] ?? "")) {
        const block = collectListLines(lines, index + 1);
        rawValue = `[${block.values.map((item) => JSON.stringify(item)).join(", ")}]`;
        index = block.nextIndex - 1;
      }

      const parsedValue = parseFrontmatterValue(key, rawValue);
      if (key === "allowed-tools") {
        if (frontmatter.tools && frontmatter.tools.length > 0) {
          fail(
            "invalid_frontmatter",
            "tools et allowed-tools ne peuvent pas être définis ensemble",
            "allowed-tools"
          );
        }
        frontmatter.tools = parsedValue as string[];
      } else {
        assignFrontmatterValue(frontmatter, key, parsedValue);
      }
    }
    if (key === "name") sawName = true;
    index += 1;
  }

  if (!sawName || !frontmatter.name.trim()) {
    fail(
      "missing_name",
      "le frontmatter doit contenir un name non vide",
      "name"
    );
  }
  return frontmatter;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function firstParagraph(instructions: string): string {
  return (
    instructions
      .split(/\n\s*\n/)
      .map((part) => part.replace(/^#+\s*/, "").trim())
      .find(Boolean) ?? ""
  );
}

function canonicalMcpNames(names: string[] | undefined): string[] {
  return (names ?? []).map(
    (name) => canonicalMcpServerName(name) ?? name.trim()
  );
}

/**
 * Analyse un SKILL.md local. Aucun fichier secondaire n'est ouvert et aucun
 * script n'est exécuté : seuls le frontmatter scalaire/listes et le corps
 * textuel sont conservés.
 */
export function parseSkillMarkdown(source: string): ParsedSkillMarkdown {
  if (typeof source !== "string") {
    fail("invalid_source", "SKILL.md doit être une chaîne de caractères");
  }
  if (source.length > MAX_SKILL_MARKDOWN_LENGTH) {
    fail("invalid_source", "SKILL.md dépasse la taille maximale autorisée");
  }
  const lines = normalizeLines(source);
  if (lines[0]?.trim() !== "---") {
    fail("missing_frontmatter", "SKILL.md doit commencer par ---");
  }
  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "---"
  );
  if (closingIndex < 0) {
    fail("invalid_frontmatter", "frontmatter SKILL.md non fermé");
  }
  const frontmatter = parseFrontmatter(lines.slice(1, closingIndex));
  const body = lines
    .slice(closingIndex + 1)
    .join("\n")
    .trim();
  if (!body) {
    fail(
      "empty_instructions",
      "le corps de SKILL.md contient aucune instruction"
    );
  }
  return { body, frontmatter, instructions: body };
}

/** Variante sans exception pour les appelants qui veulent afficher une erreur. */
export function safeParseSkillMarkdown(
  source: string
): SkillMarkdownParseResult {
  try {
    return { ok: true, value: parseSkillMarkdown(source) };
  } catch (error) {
    if (error instanceof SkillMarkdownError) {
      return {
        error: {
          code: error.code,
          field: error.field,
          message: error.message,
        },
        ok: false,
      };
    }
    return {
      error: {
        code: "invalid_source",
        message: error instanceof Error ? error.message : String(error),
      },
      ok: false,
    };
  }
}

/**
 * Convertit le document en manifeste statique. Les dépendances déclarées sont
 * ensuite validées par la même règle que les templates du catalogue.
 */
export function convertSkillMarkdown(
  source: string,
  options: ConvertSkillMarkdownOptions = {}
): SkillTemplateManifest {
  const parsed = parseSkillMarkdown(source);
  const { frontmatter, instructions } = parsed;
  const id = (options.id ?? frontmatter.id ?? slugify(frontmatter.name)).trim();
  if (!id || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) {
    fail("invalid_field", `identifiant de skill invalide : ${id}`, "id");
  }
  const description =
    frontmatter.description?.trim() ||
    firstParagraph(instructions) ||
    frontmatter.name;
  const mcpServerNames = canonicalMcpNames(frontmatter.mcpServerNames);
  const tools = (frontmatter.tools ?? [])
    .map((tool) => tool.trim())
    .filter(Boolean);
  const pluginIds = (frontmatter.pluginIds ?? [])
    .map((pluginId) => pluginId.trim())
    .filter(Boolean);
  const hasExternalDependency =
    tools.some((tool) => tool === "mcp") ||
    pluginIds.length > 0 ||
    mcpServerNames.length > 0;
  const manifest: SkillTemplateManifest = {
    author: frontmatter.author?.trim() || "Local",
    category: frontmatter.category?.trim() || "research",
    color: frontmatter.color?.trim() || "#6366f1",
    description,
    icon: { name: frontmatter.icon?.trim() || "Sparkles", type: "lucide" },
    id,
    instructions,
    mcpServerNames,
    minTier: frontmatter.minTier ?? (hasExternalDependency ? "plus" : "free"),
    name: frontmatter.name,
    parameters: frontmatter.parameters ?? [],
    pluginIds,
    tags: frontmatter.tags ?? [],
    tools,
  };

  if (options.validate !== false) {
    const validation = validateSkillTemplateManifest(manifest);
    if (!validation.valid) {
      fail(
        "invalid_manifest",
        `manifeste converti invalide : ${validation.errors.join(" ; ")}`,
        "frontmatter"
      );
    }
  }
  return manifest;
}

/** Variante résultat pour l'import ou les tests sans lever d'exception. */
export function safeConvertSkillMarkdown(
  source: string,
  options: ConvertSkillMarkdownOptions = {}
): SkillMarkdownConversionResult {
  try {
    return { ok: true, value: convertSkillMarkdown(source, options) };
  } catch (error) {
    if (error instanceof SkillMarkdownError) {
      return {
        error: {
          code: error.code,
          field: error.field,
          message: error.message,
        },
        ok: false,
      };
    }
    return {
      error: {
        code: "invalid_source",
        message: error instanceof Error ? error.message : String(error),
      },
      ok: false,
    };
  }
}

/** Alias explicite pour les appelants qui parlent de conversion, pas de parsing. */
export const skillMarkdownToTemplate = convertSkillMarkdown;
export const parseSkillMarkdownDocument = parseSkillMarkdown;
