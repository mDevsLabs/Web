/**
 * ============================================================================
 * Catalogue des outils sélectionnables dans Wakies
 * ============================================================================
 *
 * La liste des identifiants et leurs descriptions viennent de
 * `lib/ai/tools` — il n'y a pas de deuxième registre. Ce module ne fait que
 * CHOISIR, dans ce registre, ce qu'un Wakie peut se voir proposer.
 *
 * CE QUI EST VOLONTAIREMENT ABSENT
 *
 * `getWeather` et `quizzly` ne figurent pas dans la liste des outils
 * SÉLECTIONNABLES : ils sont fournis par une extension (`lib/ai/tools/ids.ts`
 * les déclare `PLUGIN_PROVIDED_TOOL_IDS`). Les proposer ici créerait une case
 * à cocher qui semble attuned mais ne produirait aucun outil si l'extension
 * n'est pas installée. L'utilisateur choisit l'extension, pas l'outil.
 *
 * LES OUTILS QUI ÉCRIVENT LE COMPTE
 *
 * `updateAccountProfile`, `updateProfilePicture` et `memory` modifient le
 * COMPTE mAI : nom, avatar, préférences. Ils sont disponibles — c'est le
 * compte du propre utilisateur — mais jamais cochés par défaut, et leur ligne
 * porte un avertissement explicite. Un compagnon de travail ne doit pas
 * réécrire le profil de qui l'a choisi sans que ce soit demandé.
 */

import { TOOLS_META, type ToolId } from "@/lib/ai/tools/config";
import { PLUGIN_PROVIDED_TOOL_IDS } from "@/lib/ai/tools/ids";

/** Identifiants qui modifient le compte mAI de l'utilisateur. */
export const OUTILS_ECRIVANT_COMPTE: readonly string[] = [
  "updateAccountProfile",
  "updateProfilePicture",
  "memory",
];

const FOURNIS_PAR_PLUGIN = new Set<string>(PLUGIN_PROVIDED_TOOL_IDS);

export type EntreeOutil = {
  /** Description compacte, pour la ligne de sélection. */
  description: string;
  /** L'outil modifie le compte mAI : la ligne porte un avertissement. */
  ecritCompte: boolean;
  /** Identifiant exact de `TOOL_IDS`. */
  id: string;
  /** Libellé français, déjà traduit dans `TOOLS_META`. */
  label: string;
};

/**
 * Les outils qu'un Wakie peut se voir proposer, dans l'ordre du registre.
 *
 * L'ordre est celui de `TOOLS_META`, lui-même alphabétique : il n'exprime
 * aucune hiérarchie, donc on ne prétend pas qu'il y en a une.
 */
export const WAKIE_TOOL_CATALOG: EntreeOutil[] = Object.values(TOOLS_META)
  .filter((meta) => !FOURNIS_PAR_PLUGIN.has(meta.id))
  .map((meta) => ({
    description: meta.description,
    ecritCompte: OUTILS_ECRIVANT_COMPTE.includes(meta.id),
    id: meta.id,
    label: meta.label,
  }));

/**
 * Les outils livrés par défaut à un Wakie.
 *
 * `webSearch` est activé SEULEMENT si le Wakie autorise la recherche : c'est
 * le sens de la case « Recherche sur les pages publiques ». Les deux autres ne
 * coûtent rien et n'agissent sur rien.
 */
export function outilsParDefaut(researchAllowed: boolean): string[] {
  return researchAllowed
    ? ["webSearch", "calculator", "dateTime"]
    : ["calculator", "dateTime"];
}

/** Un identifiant d'outil est-il connu du registre ? */
export function estOutilConnu(id: string): id is ToolId {
  return Object.hasOwn(TOOLS_META, id);
}
