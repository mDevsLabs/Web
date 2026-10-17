import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { invalidateModelCatalog, type SqlClient } from "./openrouter-models.ts";

// Deno / Val Town acceptent npm:, tandis que la CLI Bun utilise les dépendances locales.
const { neon } =
  typeof Deno === "undefined"
    ? await import("@neondatabase/serverless")
    : await import("npm:@neondatabase/serverless");

type JsonObject = Record<string, any>;

function object(value: unknown): JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function positiveInteger(value: unknown, fallback: number): number {
  return Number.isSafeInteger(value) &&
    Number(value) > 0 &&
    Number(value) <= 2_147_483_647
    ? Number(value)
    : fallback;
}

export function normalizeOpenRouterModels(data: unknown): JsonObject[] {
  if (!Array.isArray(data) || !data.length) {
    throw new Error("OpenRouter a renvoyé un catalogue vide ou invalide.");
  }
  const ids = new Set<string>();
  const models = data
    .filter((value) => {
      const id = object(value).id;
      return typeof id !== "string" || !id.toLowerCase().includes(":batch");
    })
    .map((value) => {
      const m = object(value);
      if (
        typeof m.id !== "string" ||
        !m.id ||
        m.id !== m.id.trim() ||
        ids.has(m.id) ||
        !m.id.includes("/")
      ) {
        throw new Error(
          "Le catalogue contient un identifiant invalide ou dupliqué."
        );
      }
      ids.add(m.id);
      if (
        m.supported_parameters !== null &&
        m.supported_parameters !== undefined &&
        (!Array.isArray(m.supported_parameters) ||
          m.supported_parameters.some(
            (p: unknown) => typeof p !== "string" || !p
          ))
      ) {
        throw new Error(`supported_parameters invalide pour ${m.id}`);
      }
      const name = typeof m.name === "string" && m.name ? m.name : m.id;
      const providerPrefix = name.match(/^\s*([^:]+?)\s*:\s*(.+?)\s*$/);
      const displayName =
        providerPrefix &&
        providerPrefix[1].replace(/[-_\s]/g, "").toLowerCase() ===
          m.id
            .split("/")[0]
            .replace(/[-_\s]/g, "")
            .toLowerCase()
          ? providerPrefix[2].trim()
          : name;
      return {
        architecture: object(m.architecture),
        context_length: positiveInteger(m.context_length, 128_000),
        created:
          Number.isSafeInteger(m.created) && m.created >= 0 ? m.created : 0,
        description: typeof m.description === "string" ? m.description : "",
        id: m.id,
        max_output_tokens: positiveInteger(
          m.top_provider?.max_completion_tokens,
          4096
        ),
        name: displayName,
        pricing: object(m.pricing),
        reasoning:
          m.reasoning && typeof m.reasoning === "object" ? m.reasoning : null,
        supported_parameters: [
          ...new Set<string>(m.supported_parameters ?? []),
        ],
        upstream: m,
      };
    });
  return models;
}

export interface SyncOptions {
  apiKey?: string;
  fetcher?: typeof fetch;
  signal?: AbortSignal;
}

function env(name: string): string | undefined {
  return typeof Deno === "undefined" ? process.env[name] : Deno.env.get(name);
}

export async function updateModels(sql?: SqlClient, options: SyncOptions = {}) {
  const databaseUrl = sql ? undefined : env("DATABASE_URL");
  if (!sql && !databaseUrl) throw new Error("DATABASE_URL est requis.");
  const db: SqlClient = sql ?? neon(databaseUrl!);
  const startedAt = new Date().toISOString();
  const apiKey = options.apiKey ?? env("OPENROUTER_API_KEY");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(30_000)])
    : AbortSignal.timeout(30_000);
  const response = await (options.fetcher ?? fetch)(
    "https://openrouter.ai/api/v1/models",
    { headers, signal }
  );
  if (!response.ok) throw new Error(`OpenRouter : HTTP ${response.status}`);
  const json = await response.json();
  const models = normalizeOpenRouterModels(json?.data);
  const result = models.length
    ? await persistModels(db, models, startedAt)
    : { retired: 0, skipped: true, upserted: 0 };
  await db`DELETE FROM openrouter_models WHERE POSITION(':batch' IN LOWER(id)) > 0`;
  invalidateModelCatalog(db);
  console.log("[updateModels]", result);
  return result;
}

async function persistModels(
  sql: SqlClient,
  models: JsonObject[],
  startedAt: string
) {
  const rows = await sql`
    SELECT * FROM sync_openrouter_models(${JSON.stringify(
      models
    )}::jsonb, ${startedAt}::timestamptz)
  `;
  if (!rows[0])
    throw new Error("La synchronisation n'a retourné aucun résultat.");
  return rows[0] as { upserted: number; retired: number; skipped: boolean };
}

// Handler utilisable par un CRON externe (notamment un val CRON Val Town).
export default async function runModelSync() {
  return await updateModels();
}

const invokedFile = process.argv[1];
if (
  import.meta.url.startsWith("file:") &&
  invokedFile &&
  path.resolve(invokedFile) === fileURLToPath(import.meta.url)
) {
  const { loadLocalEnv } = await import("./cli-env.ts");
  loadLocalEnv();
  await runModelSync().catch((error) => {
    console.error("[updateModels] Échec :", error.message);
    process.exitCode = 1;
  });
}
