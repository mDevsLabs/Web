/** Le curseur d'historique suit un ordre total et reste calculé en SQL. */
import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
  chatHistoryCursorCondition,
  chatHistoryOrder,
} from "@/lib/db/queries/chat-cursor";

const dialect = new PgDialect();
const ID = "22222222-2222-4222-8222-222222222222";
const LIGNE =
  '("Chat"."pinned", "Chat"."lastMessageAt", "Chat"."createdAt", "Chat"."id")';
const REPERE =
  '(SELECT c."pinned", c."lastMessageAt", c."createdAt", c."id" FROM "Chat" c WHERE c."id" = $1::uuid)';

describe("curseur de l'historique", () => {
  it("départage les égalités par createdAt puis id", () => {
    const { sql: ordre } = dialect.sqlToQuery(
      sql.join([...chatHistoryOrder], sql`, `)
    );
    expect(ordre).toBe(
      '"Chat"."pinned" desc, "Chat"."lastMessageAt" desc, "Chat"."createdAt" desc, "Chat"."id" desc'
    );
  });

  it("compare le tuple complet au repère lu par sous-requête", () => {
    const avant = dialect.sqlToQuery(
      chatHistoryCursorCondition({ direction: "before", id: ID })
    );
    expect(avant.sql).toBe(`${LIGNE} < ${REPERE}`);
    // Seul l'identifiant transite : aucun horodatage tronqué en millisecondes.
    expect(avant.params).toEqual([ID]);

    const apres = dialect.sqlToQuery(
      chatHistoryCursorCondition({ direction: "after", id: ID })
    );
    expect(apres.sql).toBe(`${LIGNE} > ${REPERE}`);
  });
});
