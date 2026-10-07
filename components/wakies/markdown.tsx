"use client";

/**
 * Rendu Markdown de Wakies.
 *
 * Le gabarit utilisait `react-markdown`, absent de l'hôte. L'y substituer par un
 * second moteur créerait deux rendus Markdown dans la même application — deux
 * grammaires de GFM, deux règles de code, deux traitements de liens. Le chat
 * mAI rend déjà le Markdown avec `streamdown` (composants/ai-elements) : on
 * réutilise ce moteur, et le texte des Wakies s'affiche comme le reste de
 * l'hôte.
 *
 * Les liens internes de Wakies (`#/spaces/…`) restent valides : un fragment
 * est résolu par rapport à la page courante, donc `#/spaces/x` pointe sur
 * `/wakies#/spaces/x`, qui est exactement la convention de navigation du
 * gabarit. Aucune interception n'est nécessaire.
 */

import { type Components, Streamdown } from "streamdown";

/**
 * `components` est repris tel quel : les vues qui voulaient remplacer le rendu
 * d'un lien ou d'une image gardent ce point de customization, sur le moteur de
 * l'hôte.
 */
export function Markdown({
  children,
  components,
}: {
  children: string;
  components?: Components;
}) {
  return <Streamdown components={components}>{children}</Streamdown>;
}
