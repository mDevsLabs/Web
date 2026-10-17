import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { buildActiveFormsFilter } from "@/lib/forms/query-filters";

describe("filtre des formulaires actifs", () => {
  it("encode les dates via les colonnes Drizzle", () => {
    const now = new Date("2026-10-12T15:00:00.000Z");
    const filter = buildActiveFormsFilter(now);
    const query = new PgDialect().sqlToQuery(filter!);

    expect(query.params).toEqual([true, now.toISOString(), now.toISOString()]);
    expect(query.params.some((value) => value instanceof Date)).toBe(false);
  });
});
