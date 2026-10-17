"use client";

/**
 * Le caret d'une `textarea` du composer Wakies.
 *
 * Le composer est une `textarea` simple, pas un `contenteditable` : le mot en
 * cours se lit par `selectionStart`, et la position écran du curseur doit être
 * RECONSTRUITE — une `textarea` ne expose aucun moyen de savoir où tombe son
 * caret. Deux fonctions, un seul endroit, parce que `/` et `@` partagent le même
 * champ : deux analyseurs concurrents pourraient désigner deux `debut`
 * différents pour la même frappe.
 */

export type MotEnCours = {
  /** Index du premier caractère du jeton (`@`, `@@` ou `/` inclus). */
  debut: number;
  /** Index d'insertion : la fin du mot tel qu'il est écrit. */
  fin: number;
  /** Le mot, préfixe inclus. */
  mot: string;
};

/**
 * Mot en cours au caret, pour `/`, `@` ou `@@`.
 *
 * Le préfixe doit être collé au début du texte ou à un espace : `a@b` n'est pas
 * une mention. La longueur est bornée à 40 pour qu'un paragraphe collé derrière
 * un `@` ne devienne pas une recherche.
 */
export function motEnCours(texte: string, curseur: number): MotEnCours | null {
  const avant = texte.slice(0, curseur);
  const match = avant.match(/(^|\s)([/@]{1,2}[^\s]{0,40})$/);
  if (!match) return null;
  const mot = match[2];
  return { debut: avant.length - mot.length, fin: avant.length, mot };
}

const POLICES_RECOPIEES = [
  "fontFamily",
  "fontSize",
  "fontStyle",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  "textTransform",
  "wordSpacing",
] as const;

/**
 * Position du caret, en pixels relatifs à la `textarea`.
 *
 * Technique du miroir : une `div` hors écran qui recopie la police, les
 * marges intérieures et la largeur du champ, reçoit le texte jusqu'au caret
 * plus une sentinelle, et c'est la position de la sentinelle qui donne celle du
 * curseur. La sentinelle vit DANS la `div` positionnée : son `offsetLeft` inclut
 * déjà le `padding-left` recopié, il ne faut pas le rajouter une seconde fois,
 * sinon le menu glisse d'une largeur de marge.
 */
export function positionCaret(
  zone: HTMLTextAreaElement
): { haut: number; gauche: number } | null {
  const miroir = document.createElement("div");
  const style = window.getComputedStyle(zone);
  miroir.style.position = "absolute";
  miroir.style.top = "-9999px";
  miroir.style.left = "-9999px";
  miroir.style.whiteSpace = "pre-wrap";
  miroir.style.overflowWrap = "break-word";
  miroir.style.width = `${zone.clientWidth}px`;
  for (const propriete of POLICES_RECOPIEES) {
    miroir.style[propriete] = style[propriete];
  }
  const curseur = zone.selectionStart ?? zone.value.length;
  miroir.textContent = zone.value.slice(0, curseur);
  const sentinelle = document.createElement("span");
  sentinelle.textContent = "";
  miroir.append(sentinelle);
  document.body.append(miroir);
  const position = {
    gauche: sentinelle.offsetLeft,
    haut: sentinelle.offsetTop,
  };
  miroir.remove();
  if (Number.isNaN(position.gauche) || Number.isNaN(position.haut)) {
    return null;
  }
  return position;
}

/**
 * Jeton à insérer, avec ses préfixes.
 *
 * Une mention à espaces EST écrite sous forme citée (`@"Mon Espace"`), parce
 * que c'est la seule forme que le serveur sait relire : `parseMentions` comme
 * `analyserMentions` ne reconnaissent qu'un mot court ou une chaîne entre
 * guillemets.
 */
export function jetonAInserer(
  jeton: string,
  options: { persistant?: boolean; cite?: boolean } = {}
): string {
  const prefixe = options.persistant ? "@@" : "@";
  return options.cite ? `${prefixe}"${jeton}"` : `${prefixe}${jeton}`;
}
