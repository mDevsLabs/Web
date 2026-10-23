// Façade de la visionneuse 3D de l'arsenal.
//
// POURQUOI CE FICHIER EXISTE
//
// La visionneuse est le SEUL module de l'interface qui importe `three` — et
// donc le seul qui tirait le moteur (522 Ko) dans le chunk d'ENTRÉE. Le jeu
// perdait alors sa propriété essentielle : le menu doit s'afficher sans le
// moteur, qui n'arrive qu'au lancement d'une opération (`check-bundle.mjs`
// vérifie exactement cela : « the engine is loaded before the interface » doit
// être FAUX).
//
// La façade ne dépend donc de RIEN de lourd : elle charge l'implémentation à la
// demande, et garde la référence du viewer monté pour pouvoir le démonter
// SYNCHRONEMENT — condition imposée par le démontage de l'écran (passer à
// l'arsenal puis en sortir ne doit pas laisser un renderer WebGL vivant).
//
// Le cycle de vie réel est dans `weapon-viewer-impl.ts`.

import type { SkinId } from '../skin-catalog.ts';
import type { UI } from '../ui.ts';

export interface ArsenalViewer {
  update(weaponId: string, skinId: SkinId): void;
  resetView(): void;
  dispose(): void;
}

/**
 * Viewer monté, s'il y en a un.
 *
 * L'implémentation s'y enregistre à la construction. La façade s'en sert pour
 * un démontage immédiat, sans attendre le chargement du module.
 */
let currentViewer: ArsenalViewer | null = null;

/**
 * Numéro de génération.
 *
 * Le chargement de l'implémentation est asynchrone : si l'utilisateur quitte
 * l'arsenal avant qu'il arrive, le viewer ne doit pas se monter. Chaque
 * montage incrémente le compteur, et l'implémentation compare le sien à celui
 * qu'elle a reçu au moment de la demande.
 */
let generation = 0;

/** Enregistre le viewer monté (appelé par l'implémentation). */
export function registerArsenalViewer(viewer: ArsenalViewer | null): void {
  currentViewer = viewer;
}

/**
 * Monte la visionneuse 3D de l'arsenal.
 *
 * L'implémentation est chargée à la demande : c'est elle qui importe `three`.
 * Un échec de chargement (WebGL absent, réseau) laisse l'arsenal s'afficher
 * sans la vision 3D — l'écran reste utilisable.
 */
export function mountArsenalViewer(ui: UI): void {
  disposeArsenalViewer(ui);
  const expected = ++generation;
  void import('./weapon-viewer-impl.ts')
    .then((module) => {
      // L'utilisateur a quitté l'arsenal pendant le chargement : on ne monte
      // rien, et la génération suivante prevails.
      if (expected !== generation) return;
      module.mountArsenalViewer(ui);
    })
    .catch(() => {
      // La visionneuse est un embellissement : son absence ne doit pas
      // casser l'arsenal.
    });
}

/** Démonte la visionneuse si elle est montée. Synchrone et idempotent. */
export function disposeArsenalViewer(ui?: UI): void {
  // Invalide tout montage en cours : l'implémentation qui arriverait après
  // cette sortie ne s'installera pas.
  generation++;
  if (currentViewer) {
    currentViewer.dispose();
    currentViewer = null;
  }
}
