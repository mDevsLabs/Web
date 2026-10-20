/**
 * ============================================================================
 * /blackline — LAYOUT DE L'INTÉGRATION
 * ============================================================================
 *
 * Ce layout est le point d'entrée de Blackline dans l'hôte. Il fait deux
 * choses, et chacune est un contrat :
 *
 * 1. IL IMPOSE LA FEUILLE DE STYLE BLACKLINE, ET ELLE SEULE.
 *    `components/blackline/blackline.css` est généré par
 *    `scripts/build-blackline-css.mjs` : tous ses sélecteurs sont ancrés sous
 *    `.blackline-root`, l'élément posé ci-dessous. Blackline est un jeu écrit
 *    pour posséder le document ; sans cet ancrage, ses bases (`html`, `body`,
 *    `:root`) et ses composants (`button`, `input`, `select`) repeindraient le
 *    chat, la barre latérale et les réglages de mAI.
 *
 * 2. IL NE DÉCIDE RIEN DE L'AFFICHAGE.
 *    Aucune logique de données : la page vient de l'App Router, et le
 *    composant client (`BlacklineHost`) gère la confirmation d'âge et le
 *    montage du jeu.
 *
 * LE JEU REMPLIT L'ESPACE DISPONIBLE
 *
 * Blackline vit dans le groupe `(chat)` — il a donc la barre latérale mAI à
 * côté, et le sélecteur d'applications reste accessible. Le jeu occupe la
 * surface restante : ce cadre est `relative` et dimensionné, pour que la
 * racine du jeu (`position:absolute; inset:0`) s'y inscrive exactement.
 *
 * La classe `blackline-root` est portée par la RACINE DU JEU, posée par
 * `components/blackline/blackline-host.tsx` — et par elle seule. La poser
 * ici aussi appliquerait deux fois les bases du jeu au même écran.
 */

import type { ReactNode } from "react";
import "@/components/blackline/blackline.css";

export default function BlacklineLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {children}
    </div>
  );
}
