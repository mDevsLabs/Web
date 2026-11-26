import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { isModelAllowedForTier } from "@/lib/ai/registry/tiers";
import { MAI_SEARCH_SUMMARY_MODEL_ID } from "@/lib/search/summary-stream";

/**
 * Extrait les résultats à synthétiser depuis le corps JSON de `/api/mai-search/summary`.
 *
 * Lit `searchResults` en priorité et tolère `sources` pour éviter tout
 * échec silencieux si un appelant transmet l'ancien champ client.
 */
export function extractSummarySearchResults(body: unknown): unknown[] {
  if (!body || typeof body !== "object") {
    return [];
  }
  const record = body as { searchResults?: unknown; sources?: unknown };
  if (Array.isArray(record.searchResults)) {
    return record.searchResults;
  }
  if (Array.isArray(record.sources)) {
    return record.sources;
  }
  return [];
}

/**
 * Résout le modèle imposé pour les synthèses mAI Search (`mai-2.5-omni`),
 * tout en gardant un repli sûr vers `DEFAULT_CHAT_MODEL` s'il venait à être
 * indisponible dans le catalogue ou restreint pour le forfait.
 */
export function resolveSummaryModelId(params: {
  catalogue: ReadonlyArray<{ id: string }>;
  tier?: string | null;
}): string {
  const existe =
    params.catalogue.length === 0 ||
    params.catalogue.some((model) => model.id === MAI_SEARCH_SUMMARY_MODEL_ID);
  const autorise = isModelAllowedForTier(
    MAI_SEARCH_SUMMARY_MODEL_ID,
    params.tier ?? "free"
  );
  return existe && autorise ? MAI_SEARCH_SUMMARY_MODEL_ID : DEFAULT_CHAT_MODEL;
}
