/**
 * Ordre d'affichage du catalogue de modèles.
 *
 * Le catalogue remonte dans l'ordre de la source (base backend, puis alias
 * cloud), qui est un ordre de GESTION, pas un ordre de LECTURE : l'utilisateur
 * voit d'abord des modèles tiers, alors que la famille mAI-2 est celle que la
 * maison met en avant.
 *
 * L'ordre d'affichage est donc décidé ici, en un seul endroit, et partagé par
 * le sélecteur de l'hôte (chat, agent, Wakies, création, réglages) et celui
 * du Site officiel : deux listes qui n'affichent pas les mêmes modèles dans
 * le même ordre divergeraient.
 *
 * Logique pure : aucun import serveur, aucun état.
 */

import { MAI_PROVIDER_KEY, resolveProviderKey } from "./provider";
import type { SharedModel } from "./types";

/**
 * Les deux modèles mAI-2, dans l'ordre où ils doivent apparaître.
 *
 * mAI-2 d'abord (le modèle phare, le plus capable), puis mAI-2-Mini (le
 * modèle rapide et quotidien). L'ordre est explicite et non alphabétique :
 * « mAI-2 » précède « mAI-2-Mini » par convention, pas par tri.
 */
export const MAI_2_MODEL_IDS = ["mai-2", "mai-2-mini"] as const;

/**
 * Le modèle appartient-il à la famille mAI-2 ?
 *
 * La comparaison ignore le préfixe fournisseur (`mdevslabs/mai-2`) : le même
 * modèle est publié sous deux écritures selon la source, et il doit rester
 * en tête dans les deux cas.
 */
export function isMai2ModelId(modelId: string): boolean {
  const id = (modelId || "").toLowerCase().replace(/^mdevslabs\//, "");
  return (MAI_2_MODEL_IDS as readonly string[]).includes(id);
}

export function isMai2Model(model: SharedModel): boolean {
  return isMai2ModelId(model.id);
}

/**
 * Rang d'un modèle dans la famille mAI-2 (0 pour mAI-2, 1 pour mAI-2-Mini).
 *
 * Un modèle hors famille vaut un rang très élevé : il passe donc après les
 * deux, sans être pour autant pénalisé.
 */
function mai2Rank(modelId: string): number {
  const id = (modelId || "").toLowerCase().replace(/^mdevslabs\//, "");
  const index = (MAI_2_MODEL_IDS as readonly string[]).indexOf(id);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

/**
 * Classe les modèles pour l'affichage.
 *
 * Trois règles, dans cet ordre :
 *
 * 1. La famille mAI-2 ouvre la liste, mAI-2 avant mAI-2-Mini.
 * 2. Le groupe mAI suit immédiatement, ses autres modèles conservant leur
 *    ordre d'origine.
 * 3. Le reste du catalogue garde l'ordre de la source — c'est le seul ordre
 *    qu'on ne connaît pas et qu'il ne faut donc pas réinventer.
 *
 * Le tri est STABLE à l'intérieur de chaque règle : deux modèles de même
 * rang conservent leur position relative, donc l'ordre de la source.
 */
export function sortModelsForDisplay(models: SharedModel[]): SharedModel[] {
  const mai2: SharedModel[] = [];
  const autresMai: SharedModel[] = [];
  const tiers: SharedModel[] = [];

  for (const model of models) {
    if (isMai2Model(model)) {
      mai2.push(model);
    } else if (resolveProviderKey(model) === MAI_PROVIDER_KEY) {
      autresMai.push(model);
    } else {
      tiers.push(model);
    }
  }

  mai2.sort((a, b) => mai2Rank(a.id) - mai2Rank(b.id));

  return [...mai2, ...autresMai, ...tiers];
}

/**
 * Regroupe les modèles par fournisseur, dans l'ordre d'affichage.
 *
 * Le groupe mAI ouvre la liste : c'est le fournisseur recommandé, et il
 * contient la famille mAI-2. Les autres groupes suivent dans l'ordre de
 * leur première apparition.
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
