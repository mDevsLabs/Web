import { describe, expect, it, vi } from "vitest";

import {
  ChatbotError,
  isSchemaDriftError,
  SCHEMA_DRIFT_MESSAGE,
  SCHEMA_DRIFT_OPERATOR_LOG,
} from "@/lib/errors";

// Erreur postgres.js telle qu'encapsulée par drizzle (« Failed query » avec
// cause PostgresError portant le SQLSTATE dans `code`).
function drizzleLikeQueryError(sqlState: string, message: string): Error {
  const pgError = new Error(message) as Error & { code: string };
  pgError.code = sqlState;
  const wrapped = new Error(`Failed query: ${message}`, { cause: pgError });
  return wrapped;
}

describe("isSchemaDriftError", () => {
  it("détecte 42P01 (relation absente) à travers la chaîne de causes", () => {
    const error = drizzleLikeQueryError(
      "42P01",
      'relation "AgentRun" does not exist'
    );
    expect(isSchemaDriftError(error)).toBe(true);
  });

  it("détecte 42703 (colonne absente) à travers la chaîne de causes", () => {
    const error = drizzleLikeQueryError(
      "42703",
      'column "agentApprovalRequired" does not exist'
    );
    expect(isSchemaDriftError(error)).toBe(true);
  });

  it("ignore les SQLSTATE sans rapport (contrainte, type invalide…)", () => {
    expect(
      isSchemaDriftError(drizzleLikeQueryError("23505", "duplicate key"))
    ).toBe(false);
    expect(
      isSchemaDriftError(drizzleLikeQueryError("42804", "datatype mismatch"))
    ).toBe(false);
    expect(isSchemaDriftError(new Error("boom"))).toBe(false);
    expect(isSchemaDriftError(null)).toBe(false);
    expect(isSchemaDriftError(undefined)).toBe(false);
  });
});

describe("ChatbotError — dérive de schéma", () => {
  it("remplace le message générique par le message explicite de dérive", () => {
    const error = new ChatbotError(
      "bad_request:database",
      { cause: drizzleLikeQueryError("42P01", 'relation "AgentRun" does not exist') }
    );
    expect(error.message).toBe(SCHEMA_DRIFT_MESSAGE);
  });

  it("journalise le signal opérateur avec le SQLSTATE", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    try {
      new ChatbotError(
        "bad_request:database",
        { cause: drizzleLikeQueryError("42703", 'column "x" does not exist') }
      );
      expect(consoleError).toHaveBeenCalledTimes(1);
      const [first, second] = consoleError.mock.calls[0];
      expect(String(first)).toContain("Schéma de base obsolète");
      expect(SCHEMA_DRIFT_OPERATOR_LOG.length).toBeGreaterThan(0);
      expect(second).toMatchObject({ sqlState: "42703" });
    } finally {
      consoleError.mockRestore();
    }
  });

  it("conserve le message générique pour une erreur base sans dérive de schéma", () => {
    const error = new ChatbotError("bad_request:database", {
      cause: drizzleLikeQueryError("23505", "duplicate key value"),
    });
    expect(error.message).not.toBe(SCHEMA_DRIFT_MESSAGE);
    expect(error.message).toContain("base de données");
  });

  it("laisse intact un ChatbotError sans cause objet", () => {
    const error = new ChatbotError("bad_request:database");
    expect(error.message).toContain("base de données");
  });

  it("la réponse HTTP reste database_error 500 avec le message explicite", () => {
    const error = new ChatbotError(
      "bad_request:database",
      { cause: drizzleLikeQueryError("42P01", 'relation "ProjectMember" does not exist') }
    );
    const response = error.toResponse();
    expect(response.status).toBe(500);
  });
});
