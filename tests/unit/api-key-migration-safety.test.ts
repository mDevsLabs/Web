import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { mprojectsApiKeys } from "@/lib/db/schema";

describe("Sécurité des migrations DB — mprojects_api_keys.key_name", () => {
  it("ne contient aucun ALTER TABLE au runtime dans api-key-manager.ts", () => {
    const filePath = resolve(process.cwd(), "lib/site/api-key-manager.ts");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/ALTER\s+TABLE/i);
    expect(content).not.toContain("ensureKeyNameColumn");
  });

  it("possède la migration 0040 et son entrée dans _journal.json", () => {
    const migrationPath = resolve(
      process.cwd(),
      "lib/db/migrations/0040_mprojects_api_keys_key_name.sql"
    );
    const migrationContent = readFileSync(migrationPath, "utf-8");
    expect(migrationContent).toContain("key_name");
    expect(migrationContent).toContain("mprojects_api_keys");

    const journalPath = resolve(
      process.cwd(),
      "lib/db/migrations/meta/_journal.json"
    );
    const journalContent = JSON.parse(readFileSync(journalPath, "utf-8"));
    const entry = journalContent.entries.find(
      (e: any) => e.tag === "0040_mprojects_api_keys_key_name"
    );
    expect(entry).toBeDefined();
    expect(entry.idx).toBe(39);
  });

  it("définit la colonne keyName dans le schéma Drizzle mprojectsApiKeys", () => {
    expect(mprojectsApiKeys.keyName).toBeDefined();
    expect(mprojectsApiKeys.apiKey).toBeDefined();
    expect(mprojectsApiKeys.plan).toBeDefined();
  });
});
