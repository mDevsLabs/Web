import { describe, expect, it } from "vitest";
import { AGENT_TOOL_CATALOG } from "@/lib/agent/tools/catalog";
import { findCatalogEntriesWithoutImplementation } from "@/lib/agent/tools/registry";

describe("Exhaustivité du catalogue d'outils Agent (Issue #32)", () => {
  it("vérifie que le catalogue déclare des outils", () => {
    const catalogKeys = Object.keys(AGENT_TOOL_CATALOG);
    expect(catalogKeys.length).toBeGreaterThan(0);
  });

  it("vérifie que chaque entrée du catalogue dispose d'une implémentation enregistrée", () => {
    const missingImplementations = findCatalogEntriesWithoutImplementation();
    expect(
      missingImplementations,
      `Outils du catalogue sans implémentation enregistrée : ${missingImplementations.join(", ")}`
    ).toEqual([]);
  });
});
