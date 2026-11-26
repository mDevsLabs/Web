/**
 * Ordre d'affichage et mise en avant du catalogue de modèles.
 *
 * Le catalogue remonte dans l'ordre de la source (base backend, puis alias
 * cloud), qui est un ordre de GESTION, pas un ordre de LECTURE : l'utilisateur
 * voit d'abord des modèles tiers, alors que la gamme mAI-2.5 (et la famille
 * mAI dans son ensemble) est celle que la maison met en avant.
 *
 * L'ordre d'affichage et la liste des modèles recommandés sont donc décidés
 * ici, en un seul endroit, et partagés par le sélecteur de l'hôte (chat,
 * agent, Wakies, création, réglages) et celui du Site officiel : deux listes
 * qui divergeraient afficheraient des badges ou un ordre incohérents.
 *
 * Logique pure : aucun import serveur, aucun état.
 */

import { MAI_PROVIDER_KEY, resolveProviderKey } from "./provider";
import type { SharedModel } from "./types";

/**
 * Modèles de la génération mAI-2.5, mis en avant et marqués « Recommandé ».
 *
 * L'ordre est explicite : Opal (phare), Apex (audit/code), Omni (quotidien).
 */
export const MAI_2_5_MODEL_IDS = [
  "mai-2.5-opal",
  "mai-2.5-apex",
  "mai-2.5-omni",
] as const;

/**
 * Les deux modèles de la génération précédente mAI-2, conservés juste après
 * mAI-2.5 mais sans le label « Recommandé ».
 *
 * « mAI-2 » précède « mAI-2-Mini » par convention, pas par tri alphabétique.
 */
export const MAI_2_MODEL_IDS = ["mai-2", "mai-2-mini"] as const;

/** Ordre de mise en avant des modèles phares mAI dans les listes. */
const FEATURED_MAI_MODEL_IDS = [
  ...MAI_2_5_MODEL_IDS,
  ...MAI_2_MODEL_IDS,
] as const;

function stripMaiPrefix(modelId: string): string {
  return (modelId || "").toLowerCase().replace(/^mdevslabs\//, "");
}

/**
 * Le modèle porte-t-il le label « Recommandé » ?
 *
 * Seule la génération mAI-2.5 (Opal, Apex, Omni) est recommandée ; la
 * génération précédente mAI-2 / mAI-2-Mini n'est plus mise en avant par ce
 * badge. La comparaison ignore le préfixe fournisseur (`mdevslabs/...`).
 */
export function isRecommendedModelId(modelId: string): boolean {
  const id = stripMaiPrefix(modelId);
  return (MAI_2_5_MODEL_IDS as readonly string[]).includes(id);
}

export function isRecommendedModel(model: SharedModel): boolean {
  return isRecommendedModelId(model.id);
}

/**
 * Le modèle appartient-il à la génération mAI-2 (`mai-2` ou `mai-2-mini`) ?
 *
 * La comparaison ignore le préfixe fournisseur (`mdevslabs/mai-2`).
 */
export function isMai2ModelId(modelId: string): boolean {
  const id = stripMaiPrefix(modelId);
  return (MAI_2_MODEL_IDS as readonly string[]).includes(id);
}

export function isMai2Model(model: SharedModel): boolean {
  return isMai2ModelId(model.id);
}

/**
 * Rang d'affichage d'un modèle phare mAI (0..2 pour mAI-2.5, 3..4 pour mAI-2).
 *
 * Tout autre modèle vaut `Number.MAX_SAFE_INTEGER` et passe donc après.
 */
export function featuredMaiRank(modelId: string): number {
  const id = stripMaiPrefix(modelId);
  const index = (FEATURED_MAI_MODEL_IDS as readonly string[]).indexOf(id);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

/**
 * Classe les modèles pour l'affichage.
 *
 * Trois règles, dans cet ordre :
 *
 * 1. La génération mAI-2.5 (Opal, Apex, Omni) ouvre la liste, suivie de
 *    mAI-2 puis mAI-2-Mini.
 * 2. Les autres modèles du groupe mAI suivent immédiatement, dans leur ordre
 *    d'origine.
 * 3. Le reste du catalogue garde l'ordre de la source — c'est le seul ordre
 *    qu'on ne connaît pas et qu'il ne faut donc pas réinventer.
 *
 * Le tri est STABLE à l'intérieur de chaque règle : deux modèles de même
 * rang conservent leur position relative, donc l'ordre de la source.
 */
export function sortModelsForDisplay(models: SharedModel[]): SharedModel[] {
  const featured: SharedModel[] = [];
  const autresMai: SharedModel[] = [];
  const tiers: SharedModel[] = [];

  for (const model of models) {
    if (featuredMaiRank(model.id) !== Number.MAX_SAFE_INTEGER) {
      featured.push(model);
    } else if (resolveProviderKey(model) === MAI_PROVIDER_KEY) {
      autresMai.push(model);
    } else {
      tiers.push(model);
    }
  }

  featured.sort((a, b) => featuredMaiRank(a.id) - featuredMaiRank(b.id));

  return [...featured, ...autresMai, ...tiers];
}

/**
 * Regroupe les modèles par fournisseur, dans l'ordre d'affichage.
 *
 * Le groupe mAI ouvre la liste : c'est le fournisseur recommandé, et il
 * contient les gammes mAI-2.5 puis mAI-2. Les autres groupes suivent dans
 * l'ordre de leur première apparition.
 */
export function groupModelsByProvider(
  models: SharedModel[]
): { models: SharedModel[]; providerKey: string }[] {
  const buckets = new Map<string, SharedModel[]>();
  for (const model of sortModelsForDisplay(models)) {
    const key = resolveProviderKey(model);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(model);
    } else {
      buckets.set(key, [model]);
    }
  }

  const groups = Array.from(buckets.entries()).map(([providerKey, list]) => ({
    models: list,
    providerKey,
  }));

  // Le groupe mAI passe en tête, quel que soit l'ordre de la source.
  return groups.sort((a, b) => {
    if (a.providerKey === MAI_PROVIDER_KEY) return -1;
    if (b.providerKey === MAI_PROVIDER_KEY) return 1;
    return 0;
  });
}
