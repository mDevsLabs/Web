// Point d'entrée PUBLIC du jeu.
//
// POURQUOI CE FICHIER EXISTE
//
// L'hôte mAI importe le jeu par un chemin FIXE :
// `/blackline/assets/blackline.js`. Il y cherche un point de montage.
//
// LE CONTRAT EST UN OBJET SUR `window`
//
// Rollup RENOMME les exports d'un chunk d'entrée : `mountBlackline` devient
// `r`. Pire, l'arbreur peut les ÉLAGUER : le point d'entrée n'a personne à
// qui parler tant que l'hôte ne l'appelle pas.
//
// Un nom d'export n'est donc pas un contrat fiable. Un OBJET l'est : ses
// PROPRIÉTÉS ne sont pas renommées par le minifieur, et une affectation sur
// `window` ne peut pas être élaguée — rien ne la rend inutile au regard de
// l'arbreur.
//
// L'hôte appelle donc `window.blackline.mount(...)`. C'est le SEUL point de
// contact entre les deux mondes.
//
// `mountBlackline` reste exporté pour l'application autonome et pour les
// tests : c'est le même code, appelable directement.

// La feuille de style du jeu est importée ICI, et nulle part ailleurs.
//
// L'ordre des feuilles détermine la cascade : les overlays de gameplay
// s'empilent dans un ordre précis, et un import de plus ou de moins les
// inverserait. `scripts/check-bundle.mjs` vérifie qu'il n'y a qu'un seul
// point d'entrée CSS.
import './theme.css';

import { bindNativeEvents, mountBlackline } from './entry.ts';

export { mountBlackline };
export type { MountOptions } from './entry.ts';

/**
 * Le contrat d'intégration, sous forme d'OBJET.
 *
 * Les propriétés d'un objet survivent à la minification : c'est la seule
 * forme fiable pour un point d'entrée consommé par une application
 * EXTÉRIEURE, dont le code ne peut pas être coordonné avec le build.
 */
export const blackline = { mount: mountBlackline };

declare global {
  interface Window {
    blackline?: { mount: typeof mountBlackline };
  }
}

if (typeof window !== "undefined") {
  window.blackline = blackline;
}

/**
 * Le jeu est-il ouvert comme une page entière ?
 *
 * C'est le cas de l'application autonome : son `index.html` charge ce
 * fichier, et personne d'autre ne va monter le jeu. L'hôte mAI, lui, importe
 * le module et appelle `mountBlackline` lui-même.
 *
 * Le marqueur est explicite : l'application autonome pose
 * `data-blackline-standalone` sur son `<body>`. Rien n'est deviné — une
 * erreur d'interprétation monterait le jeu deux fois, ou pas du tout.
 */
function monterAutonome(): void {
  const corps = document.body;
  if (!corps || corps.dataset.blacklineStandalone !== "true") {
    return;
  }
  void (async () => {
    const ui = await mountBlackline({
      container: corps,
      root: document.documentElement,
    });
    if (ui) {
      bindNativeEvents(ui);
    }
  })();
}

monterAutonome();
