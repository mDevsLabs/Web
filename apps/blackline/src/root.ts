// La racine du jeu : l'élément qui PORTE son style, ses classes et ses
// variables.
//
// POURQUOI CE MODULE EXISTE
//
// Le jeu a été écrit pour posséder le document entier : il posait ses classes
// (`touch-device`, `reduced-motion`, `left-handed`…) et ses variables CSS sur
// `document.documentElement`, et sa feuille de style déclarait `:root`, `html`
// et `body`. Intégré dans l'hôte mAI, ce document est celui du CHAT : les
// classes du jeu repeindraient la barre latérale, les réglages et le
// composeur, et `overflow:hidden` sur `body` casserait le défilement.
//
// Ce module centralise l'accès à la racine pour que l'adaptation soit
// explicite et réversible : un seul endroit décide « où vivent les classes du
// jeu », et le jeu ne manipule plus jamais `<html>`.
//
// DEUX MONDES, UNE SEULE API
//
// - L'application autonome (Electron, Capacitor, `index.html` du dépôt) monte
//   le jeu dans SON document : la racine est `<html>`, et la feuille de style
//   d'origine s'applique telle quelle. Rien ne change pour ces applications.
//
// - L'hôte mAI monte le jeu dans un conteneur `.blackline-root` : la racine
//   est cet élément, et `scripts/build-blackline-css.mjs` re-ancre toute la
//   feuille de style du jeu sous ce même sélecteur.
//
// Les deux cas partagent donc le même code : `root` est toujours l'élément qui
// porte les classes du jeu, et la feuille de style — celle d'origine ou sa
// version re-ancrée — describe exactement les mêmes états.

/**
 * Racine du jeu : l'élément qui porte le style, les classes et les variables.
 *
 * Elle est posée une fois, au montage. Les lectures suivantes (`root()`) sont
 * synchrones et sans exception : un montage incomplet est un bug de montage,
 * pas un état à gérer.
 */
let rootElement: HTMLElement | null = null;

/**
 * Hôte des superpositions transitoires (overlay « tournez votre téléphone »).
 *
 * C'est un élément distinct de la racine parce que les deux cas ne se
 * ressemblent pas : dans l'application autonome, l'overlay doit couvrir le
 * VIEWPORT (`document.body`) ; dans l'hôte mAI, il doit couvrir le JEU
 * seulement — recouvrir la barre latérale du chat serait une faute.
 */
let overlayHost: HTMLElement | null = null;

/** Élément portant la racine du jeu. Lance si le jeu n'est pas monté. */
export function root(): HTMLElement {
  if (!rootElement) {
    throw new Error(
      "BLACKLINE : la racine du jeu n'est pas montée. Appelez mountBlackline() avant d'utiliser le jeu."
    );
  }
  return rootElement;
}

/** La racine est-elle montée ? Évite de lever pour une simple vérification. */
export function isMounted(): boolean {
  return rootElement !== null;
}

/**
 * Pose la racine du jeu et l'hôte des superpositions.
 *
 * `element` reçoit les classes et les variables CSS du jeu. `overlay` reçoit
 * les couches qui doivent passer AU-DESSUS du jeu (overlay d'orientation) :
 * par défaut, la racine elle-même.
 */
export function setRoot(element: HTMLElement, overlay?: HTMLElement): void {
  rootElement = element;
  overlayHost = overlay ?? element;
}

/** Libère la racine (démontage). Les classes du jeu restent sur l'élément. */
export function clearRoot(): void {
  rootElement = null;
  overlayHost = null;
}

/** Élément qui reçoit les superpositions transitoires du jeu. */
export function overlay(): HTMLElement {
  if (!overlayHost) {
    throw new Error(
      "BLACKLINE : aucune superposition montée. Appelez mountBlackline() avant d'utiliser le jeu."
    );
  }
  return overlayHost;
}

/**
 * Bascule une classe du jeu sur la racine.
 *
 * Remplace les `documentElement.classList.toggle(...)` du code d'origine. Le
 * paramètre `force` permet d'exprimer un état ABSENT (`toggle` avec un
 * deuxième argument) sans lire la classe courante.
 */
export function toggleRootClass(name: string, force?: boolean): void {
  if (force === undefined) {
    root().classList.toggle(name);
    return;
  }
  root().classList.toggle(name, force);
}

/** Pose une variable CSS sur la racine du jeu. */
export function setRootProperty(name: string, value: string): void {
  root().style.setProperty(name, value);
}
