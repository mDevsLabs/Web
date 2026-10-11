/**
 * ============================================================================
 * VIBE — SONDES DE SCHÉMA (lib/vibe/server/schema.ts)
 * ============================================================================
 *
 * Les tables Vibe ne sont pas dans le schéma Drizzle de l'hôte : leur DDL
 * appartient au backend (`ensure*` au chargement + `apps/vibe/lib/db/
 * migrations/`). Ce module est l'unique source des informations dont un
 * lecteur a besoin pour écrire du SQL sans casser : le type réel des
 * identifiants utilisateurs, et la présence des colonnes ajoutées
 * paresseusement. Sonde `information_schema`, jamais de DDL.
 *
 * Sonde live (2026-10-10, base Neon de `DATABASE_URL`) : `users.id` est
 * `integer` ; toutes les FK Vibe (`profiles.user_id`, `posts.author_id`,
 * `follows.follower_id`, `notifications.recipient_id`, `direct_messages.
 * sender_id`, `user_settings.user_id`…) sont `integer` ; les ids d'objets
 * (`posts.id`, `comments.id`, `direct_messages.id`, `notifications.id`,
 * `vibe_books.id`) sont `uuid`. Les casts `::bigint` du backend sont donc
 * corrects en production ; le code de l'hôte qui suppose `users.id` uuid
 * (`lib/db/queries.ts:443`) n'a jamais rencontré cette table réelle.
 */
import "server-only";
import { vibeSql } from "./db";

export type UserIdCast = "bigint" | "uuid" | "text";

let castPromise: Promise<UserIdCast> | null = null;

async function probeUserIdCast(): Promise<UserIdCast> {
  const sql = vibeSql();
  if (!sql) {
    return "text";
  }
  try {
    const rows = await sql`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'id' LIMIT 1
    `;
    const type = String(rows[0]?.data_type || "");
    if (type === "uuid") {
      return "uuid";
    }
    if (
      ["bigint", "int", "int4", "int8", "integer", "smallint"].includes(type)
    ) {
      return "bigint";
    }
    return "text";
  } catch {
    return "text";
  }
}

/** Type de `users.id`, sondé une fois par process. */
export function userIdCast(): Promise<UserIdCast> {
  if (!castPromise) {
    castPromise = probeUserIdCast();
  }
  return castPromise;
}

/** Un id utilisateur est-il exploitable avec tel cast ? (défense injection) */
export function isUserIdForCast(raw: string, cast: UserIdCast): boolean {
  if (cast === "bigint") {
    return /^\d{1,19}$/.test(raw);
  }
  if (cast === "uuid") {
    return /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(raw);
  }
  return raw.length > 0 && raw.length <= 64;
}

const columnCache = new Map<string, boolean>();

/**
 * Présence d'une colonne (sonde `information_schema`, mémorisée par process).
 * À préférer au `try/catch` 42703 : une erreur en plein `sql` transactionnel
 * annule toute la requête, alors que les lecteurs ont besoin de la LISTE des
 * colonnes pour construire leur SELECT (`hide_verified_badge`,
 * `onboarding_completed`, `personalization_enabled`…).
 */
export async function columnExists(
  table: string,
  column: string
): Promise<boolean> {
  const key = `${table}.${column}`;
  const known = columnCache.get(key);
  if (known !== undefined) {
    return known;
  }
  const sql = vibeSql();
  if (!sql) {
    return false;
  }
  try {
    const rows = await sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = ${table} AND column_name = ${column} LIMIT 1
    `;
    const present = rows.length > 0;
    columnCache.set(key, present);
    return present;
  } catch {
    columnCache.set(key, false);
    return false;
  }
}

const tableCache = new Map<string, boolean>();

/** Présence d'une table (sonde mémorisée). Absente ⇒ lecteur retourne null. */
export async function tableExists(table: string): Promise<boolean> {
  const known = tableCache.get(table);
  if (known !== undefined) {
    return known;
  }
  const sql = vibeSql();
  if (!sql) {
    return false;
  }
  try {
    const rows = await sql`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${table} LIMIT 1
    `;
    const present = rows.length > 0;
    tableCache.set(table, present);
    return present;
  } catch {
    tableCache.set(table, false);
    return false;
  }
}
