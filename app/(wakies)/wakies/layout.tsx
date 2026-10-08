/**
 * ============================================================================
 * /wakies — LAYOUT DE L'INTÉGRATION
 * ============================================================================
 *
 * Wakies vit dans son PROPRE groupe de routes (`app/(wakies)/wakies`), et non
 * dans `(chat)`. Ce n'est pas un détail d'organisation, c'est une contrainte
 * de rendu :
 *
 * 1. L'interface de Wakies est une application à VIEWPLEIN. Son rail de
 *    navigation et sa barre latérale sont en `position: fixed` sur `left: 0`,
 *    et sa grille compte sur toute la largeur. Dans le layout `(chat)`, elle
 *    hériterait de la barre latérale mAI — et son rail se retrouverait
 *    underneath, invisible, ou décalé.
 *
 * 2. Le portage NE DOIT PAS modifier ce code CSS : la feuille générée
 *    (`components/wakies/wakies.css`) ré-ancre chaque sélecteur sous
 *    `.wakies-root` et laisse le design intact. Changer la mise en page pour
 *    qu'elle tienne dans une colonne meant de retoucher ces 970 règles ; le
 *    pleine page règle le problème à la racine.
 *
 * 3. L'accès reste protégé : `proxy.ts` couvre toutes les routes par son motif
 *    générique, et vérifie le `exp` du jeton de session avant de laisser
 *    passer. Sans session valide, `/wakies` redirige vers `/login` — exactement
 *    comme le reste de l'application.
 *
 * CE QUE CE LAYOUT IMPOSE
 *
 * Les deux feuilles générées, et elles seules. Wakies porte son thème clair
 * (fond #f8f7f4, texte #333641) et ses propres composants (`button`, `input`,
 * `.sidebar`…). Sans le re-ancrage sous `.wakies-root`, ces règles
 * repeindraient et redessineraient le chat, la barre latérale et les réglages
 * de mAI.
 */

import type { ReactNode } from "react";
import "@/components/wakies/wakies.css";
import "@/components/wakies/wakies-editor.css";
// Après les deux feuilles générées : n'agit que sur les contrôles de l'hôte
// (sélecteur de modèle) — voir l'en-tête du fichier.
import "@/components/wakies/wakies-host.css";

export default function WakiesLayout({ children }: { children: ReactNode }) {
  // `wakies-root` est le porteur du thème ET des sélecteurs : l'élément doit
  // englober l'application entière, pas être posé autour d'un fragment.
  return (
    <div className="wakies-root h-dvh w-full overflow-hidden">{children}</div>
  );
}
