/**
 * Résolution du modèle IA d'un Wakie.
 *
 * Trois niveaux, du plus précis au plus général : le modèle choisi pour LA
 * conversation (menu de l'en-tête du chat), puis celui du Wakie (défaut de ses
 * nouvelles conversations), puis le modèle par défaut de l'application. Un
 * candidat vide ou illisible est simplement ignoré : le repli est le défaut,
 * jamais une chaîne construite à partir d'une saisie.
 *
 * La liste des modèles réellement accessibles est dynamique (catalogue de
 * l'API mAI, filtré par forfait) : c'est le backend qui tranche l'accès. Le
 * rôle de cette fonction est de ne jamais transmettre une valeur vide au
 * fournisseur, pas de tenir un catalogue local qui divergerait du sien.
 */

import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";

export function resolveWakieModelId(
  ...candidates: (string | null | undefined)[]
): string {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return DEFAULT_CHAT_MODEL;
}
