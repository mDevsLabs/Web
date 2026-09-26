// Catalogue des modèles d'agents.
//
// Contrairement aux catalogues de Skills et de MCP (statiques et versionnés),
// les modèles d'agents restent en base : ils sont semés par la migration
// 0007_agents.sql. Ce helper isole la règle de dédoublonnage appliquée à la
// lecture, pour qu'elle soit testable sans base et réutilisable.

export type AgentTemplateIdentity = { id: string; name: string };

/**
 * Ne garde que la première occurrence de chaque nom.
 *
 * La migration 0029 supprime les doublons et pose un index UNIQUE sur
 * ("name"), ce qui rend le seed de 0007 idempotent. Cette garde reste
 * néanmoins nécessaire : une base migrée à la main, ou une ligne insérée
 * avant la contrainte, ne doit jamais afficher deux fois le même modèle.
 *
 * L'ordre d'entrée est préservé (les lignes sont triées par nom en SQL), donc
 * « première occurrence » = plus ancienne ligne.
 */
export function dedupeAgentTemplatesByName<T extends AgentTemplateIdentity>(
  rows: readonly T[]
): T[] {
  const byName = new Map<string, T>();
  for (const row of rows) {
    if (!byName.has(row.name)) {
      byName.set(row.name, row);
    }
  }
  return [...byName.values()];
}
