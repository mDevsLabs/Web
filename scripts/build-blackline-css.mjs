#!/usr/bin/env node
/**
 * ============================================================================
 * CONSTRUCTION DE LA FEUILLE DE STYLE BLACKLINE POUR L'HÔTE mAI
 * ============================================================================
 *
 * POURQUOI CE SCRIPT
 *
 * Blackline est un jeu écrit pour POSSÉDER LE DOCUMENT : sa feuille de style
 * déclare `:root`, `html` et `body`, et pose ses composants sur des sélecteurs
 * nus (`button`, `input`, `select`, `*`). Intégré à l'hôte mAI, ce document est
 * celui du CHAT : les règles s'appliqueraient à l'application ENTIÈRE, et le
 * jeu repeindrait la barre latérale, les réglages et le composeur.
 *
 * L'APPROCHE — LA MÊME QUE VIBE ET WAKIES
 *
 * On ne change pas le design du jeu : on change la PORTÉE de chaque règle. Le
 * fichier est lu en AST (PostCSS — même chaîne que Turbopack, donc aucun
 * analyseur maison à maintenir), puis chaque liste de sélecteurs est re-ancrée
 * sous `.blackline-root`, l'élément que pose la page hôte.
 *
 * La correspondance est une TABLE, pas une suite de « remplacements » :
 *
 *   :root, html, body                  → .blackline-root
 *   html.x                             → .blackline-root.x
 *   .touch-device X                    → .blackline-root.touch-device X
 *   button / input / select / *        → .blackline-root <sélecteur>
 *
 * CE QUI EST EN PLUS, ET POURQUOI
 *
 * 1. `position:fixed` → `position:absolute`.
 *    Le canvas (`#game-canvas`) et l'overlay d'orientation (`#landscape-gate`)
 *    sont en `fixed; inset:0` : dans l'application autonome, ils couvrent le
 *    VIEWPORT ; dans l'hôte mAI, ils couvriraient la BARRE LATÉRALE du chat.
 *    `fixed` se référence au viewport et ne peut pas être borné par une
 *    ancêtre ( sauf `transform` ) : la conversion en `absolute` les rattache
 *    à la racine du jeu, qui est dimensionnée.
 *
 * 2. `@keyframes` → préfixe `blackline-`.
 *    Les noms (`feed-in`, `loading`, `pulse`…) sont globaux. Le même nom dans
 *    l'hôte ferait osciller l'interface mAI. Le préfixe rend l'collision
 *    impossible — et le test d'isolation l'exige, comme pour Wakies.
 *
 * 3. `@font-face` : l'URL de la police est ABSOLUE (`/fonts/blackline.woff`).
 *    Elle doit pointer vers l'emplacement public du jeu (`/blackline/fonts/…`),
 *    sinon la police du jeu ne se charge pas dans l'hôte.
 *
 * GARDE-FOUS : le script ÉCHOUE (code 1) plutôt que d'écrire une feuille
 * partielle. Une règle qui n'a pas pu être ancrée, un sélecteur document
 * résiduel, une source disparue : tout est signalé, et rien n'est écrit.
 *
 * SORTIE : components/blackline/blackline.css — importé par
 * app/(chat)/blackline/layout.tsx et par lui seul. Le fichier est généré : il
 * est EXCLU du lint (biome.jsonc), comme components/vibe/vibe.css.
 *
 * Relancer après toute modification du jeu :
 *   node scripts/build-blackline-css.mjs
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import postcss from "postcss";

const RACINE = resolve(import.meta.dirname, "..");
const JEU = resolve(RACINE, "apps/blackline");

/** Élément porteur de Blackline dans l'hôte — le sujet de toutes les règles. */
const PORTEUR = ".blackline-root";

/** Préfixe des `@keyframes` du jeu, pour ne pas entrer en collision. */
const PREFIXE_KEYFRAMES = "blackline-";

/**
 * Feuille CSS produite par le build Vite.
 *
 * On lit la SORTIE du build, pas les 21 feuilles sources : celles-ci
 * s'importent les unes les autres (`@import`) et leur ordre détermine la
 * cascade. Le build les a déjà concaténées dans le bon ordre.
 */
const SORTIE_BUILD = resolve(JEU, "dist/assets");
const SORTIE = resolve(RACINE, "components/blackline/blackline.css");

/** Emplacement public de la police du jeu. */
const POLICE_PUBLIQUE = "/blackline/fonts/blackline.woff";

/**
 * Classes d'ÉTAT du jeu, portées par sa RACINE.
 *
 * Le jeu les pose sur la racine (`apps/blackline/src/root.ts` :
 * `toggleRootClass`), et nowhere else. Une règle qui les attend sur un
 * DESCENDANT ne s'appliquerait donc jamais — c'est pourquoi elles sont
 * fusionnées dans la racine au lieu d'être simplement préfixées.
 *
 * La liste est EXHAUSTIVE et voluntary : y ajouter une classe d'état sans
 * la poser sur la racine produirait une règle qui ne s'applique jamais
 * (c'est le défaut inverse, et tout aussi silencieux).
 */
const CLASSES_ETAT = new Set([
  ".left-handed",
  ".no-screen-effects",
  ".portrait-blocked",
  ".reduced-motion",
  ".touch-device",
]);

/**
 * Sélecteurs laissés tels quels, avec leur raison. Toute autre règle non
 * ancrée fait échouer la génération.
 */
const EXCEPTIONS = [
  {
    motif: /^::view-transition-(old|new)\(root\)$/,
    raison:
      "pseudo-élément du document : l'ancrer le rendrait inerte. N'existe que le temps d'une transition de vue.",
  },
];

/**
 * Propriétés dont la valeur change quand la cible passe de `html, body` à
 * `.blackline-root`. `overflow:hidden` sur `body` couperait le défilement de
 * TOUTE la page mAI ; sur la racine du jeu, il ne borne que le jeu.
 */
const DECLARATIONS_BODY = {};

/** Emplacements des règles `position:fixed` à convertir en `absolute`. */
const POSITION_FIXE = "position";
const VALEUR_FIXE = "fixed";
const VALEUR_ABSOLU = "absolute";

/**
 * Un espace multiple vaut un espace : la comparaison doit être stable.
 * L'aplatissement s'arrête aux chaînes (`[title="a  b"]` garde ses espaces).
 */
function normaliser(selecteur) {
  let sortie = "";
  let espace = false;
  let chaine = null;
  // Itérateur explicite : un `\` dans une chaîne consomme le caractère suivant.
  const caracteres = selecteur[Symbol.iterator]();

  for (const c of caracteres) {
    if (chaine) {
      sortie += c;
      if (c === "\\") {
        const echappe = caracteres.next();
        if (!echappe.done) sortie += echappe.value;
      } else if (c === chaine) {
        chaine = null;
      }
      continue;
    }
    if (c === '"' || c === "'") {
      chaine = c;
      sortie += c;
      espace = false;
      continue;
    }
    if (/\s/.test(c)) {
      espace = true;
      continue;
    }
    if (espace && sortie) sortie += " ";
    espace = false;
    sortie += c;
  }

  return sortie;
}

/**
 * Découpe une liste de sélecteurs sur les virgules de PREMIER niveau.
 *
 * `selector.split(",")` serait faux : le `:not(.a, .b)` et les valeurs
 * d'attribut peuvent contenir des virgules. On suit donc la profondeur des
 * parenthèses et des crochets, et l'état des chaînes.
 */
function decouperSelecteurs(liste) {
  const sortie = [];
  let courant = "";
  let profondeur = 0;
  let chaine = null;

  for (let i = 0; i < liste.length; i++) {
    const c = liste[i];
    if (chaine) {
      courant += c;
      if (c === "\\") {
        courant += liste[i + 1] ?? "";
        i++;
      } else if (c === chaine) {
        chaine = null;
      }
      continue;
    }
    if (c === '"' || c === "'") {
      chaine = c;
      courant += c;
      continue;
    }
    if (c === "(" || c === "[") profondeur++;
    if (c === ")" || c === "]") profondeur--;
    if (c === "," && profondeur === 0) {
      sortie.push(courant);
      courant = "";
      continue;
    }
    courant += c;
  }
  sortie.push(courant);

  return sortie.map(normaliser).filter(Boolean);
}

/** Sélecteur déjà ancré : idempotence (le script peut être relancé sur sa sortie). */
function dejaAncre(selecteur) {
  return new RegExp(`^${PORTEUR}(?![\\w-])`).test(selecteur);
}

/**
 * Découpe un sélecteur en [tête, reste] : la tête est le premier sélecteur
 * composé, le reste commence au premier combinateur.
 *
 * La découpe ne s'arrête ni dans les parenthèses (`:where(a b)`, `:not(.x, .y)`)
 * ni dans les crochets ni dans les chaînes : ce sont les mêmes pièges que pour
 * la découpe de liste, et une tête fausse produit un sélecteur faux. Une tête
 * peut donc légitimement contenir des espaces (`:where(button, a):focus-visible`).
 */
function decouperTete(selecteur) {
  let profondeur = 0;
  let chaine = null;

  for (let i = 0; i < selecteur.length; i++) {
    const c = selecteur[i];
    if (chaine) {
      if (c === "\\") i++;
      else if (c === chaine) chaine = null;
      continue;
    }
    if (c === '"' || c === "'") {
      chaine = c;
      continue;
    }
    if (c === "(" || c === "[") {
      profondeur++;
      continue;
    }
    if (c === ")" || c === "]") {
      profondeur--;
      continue;
    }
    if (
      profondeur === 0 &&
      (/\s/.test(c) || c === ">" || c === "+" || c === "~")
    ) {
      return [selecteur.slice(0, i), selecteur.slice(i).trim()];
    }
  }

  return [selecteur, ""];
}

/**
 * Tête de sélecteur ramenée à la racine Blackline.
 *
 *   html | body | :root      → la racine elle-même (elle PORTE le thème, les
 *                              jetons et la surface que `<body>` portait) ;
 *   html.x                    → .blackline-root.x ;
 *   .classe X                 → .blackline-root.classe X — le jeu pose ses
 *                              classes d'état (`touch-device`, `left-handed`,
 *                              `reduced-motion`…) sur SA RACINE, donc la
 *                              classe est portée par la racine, pas d'un
 *                              descendant ;
 *   tout le reste             → descendant : .blackline-root <tête>.
 */
function ancrerTete(tete) {
  if (tete === "html" || tete === "body" || tete === ":root") return PORTEUR;
  if (tete.startsWith("html")) return `${PORTEUR}${tete.slice(4)}`;
  // Les CLASSES D'ÉTAT du jeu sont portées par sa RACINE : le jeu les pose
  // sur elle (`toggleRootClass`). `.touch-device .nav-item` doit donc devenir
  // `.blackline-root.touch-device .nav-item` — et NON
  // `.blackline-root .touch-device .nav-item`, qui chercherait la classe sur
  // un DESCENDANT, où elle n'est jamais.
  //
  // Seules ces classes-là sont concernées : une classe de composant
  // (`.shop-card-body`) désigne un élément à l'intérieur du jeu, et doit
  // rester un descendant.
  const [classe, ...suite] = tete.split(/(?=[.:#[])/);
  if (CLASSES_ETAT.has(classe)) {
    const reste = suite.join("");
    return `${PORTEUR}${classe}${reste}`;
  }
  if (dejaAncre(tete)) return tete;
  return `${PORTEUR} ${tete}`;
}

/**
 * Ancre UN sélecteur sous `.blackline-root`.
 *
 * `html.light body` mérite son cas : dans le jeu la règle visait le `<body>`,
 * qui portait la surface. Ici le porteur EST la racine — le `body` final est
 * donc absorbé, sinon le sélecteur chercherait un <body> inexistant sous
 * `.blackline-root` et la règle ne s'appliquerait jamais.
 */
function ancrer(selecteur) {
  const s = normaliser(selecteur);

  if (dejaAncre(s)) return s;
  if (EXCEPTIONS.some((e) => e.motif.test(s))) return s;

  const [tete, reste] = decouperTete(s);
  const ancree = ancrerTete(tete);

  return !reste || reste === "body" ? ancree : `${ancree} ${reste}`;
}

/** Ancre une liste complète, en supprimant les doublons créés par le mapping. */
function ancrerListe(liste) {
  const ancres = decouperSelecteurs(liste).map(ancrer);
  return [...new Set(ancres)];
}

/** Vrai si la règle vit sous un `@keyframes` (son « sélecteur » est un pourcentage). */
function dansKeyframes(regle) {
  for (let parent = regle.parent; parent; parent = parent.parent) {
    if (parent.type === "atrule" && AT_RULES_SANS_SELECTEUR.has(parent.name)) {
      return true;
    }
  }
  return false;
}

/** At-rules dont les « sélecteurs » ne sont pas des sélecteurs. */
const AT_RULES_SANS_SELECTEUR = new Set(["keyframes", "font-face", "property"]);

function echouer(messages) {
  console.error("✗ blackline.css NON généré — la portée serait incomplète :");
  for (const message of messages) console.error(`  ${message}`);
  process.exit(1);
}

// ── Source : la feuille produite par le build Vite ─────────────────────────
if (!existsSync(SORTIE_BUILD)) {
  echouer([
    `build Vite absent : ${SORTIE_BUILD}`,
    "Lancez d'abord `node scripts/build-blackline.mjs` (ou `npm run build` dans apps/blackline).",
  ]);
}

const fichiersCss = readdirSync(SORTIE_BUILD).filter((nom) =>
  nom.endsWith(".css")
);
if (fichiersCss.length === 0) {
  echouer([
    `aucune feuille CSS dans ${SORTIE_BUILD}`,
    "Le build Vite n'a rien produit : vérifiez `npm run build` dans apps/blackline.",
  ]);
}

const source = resolve(SORTIE_BUILD, fichiersCss[0]);
const racine = postcss.parse(readFileSync(source, "utf8"), { from: source });
const echecs = [];

// ── 1. Les `@keyframes` sont renommés ──────────────────────────────────────
//
// Un nom global (`pulse`, `loading`) ferait osciller l'interface mAI. Le
// préfixe rend la collision impossible.
const renommages = new Map();
racine.walkAtRules("keyframes", (atRule) => {
  const avant = atRule.params.trim();
  if (avant.startsWith(PREFIXE_KEYFRAMES)) return;
  const apres = `${PREFIXE_KEYFRAMES}${avant}`;
  renommages.set(avant, apres);
  atRule.params = apres;
});

// Les règles qui utilisaient l'ancien nom (`animation: pulse 2s`) doivent
// suivre le renommage.
if (renommages.size > 0) {
  racine.walkDecls((decl) => {
    for (const [avant, apres] of renommages) {
      // On ne remplace que des NOMMES d'animation : le mot doit être seul dans
      // la liste (séparé par une virgule ou un espace), pas au milieu d'un
      // autre mot.
      const motif = new RegExp(`(^|[\\s,])${avant}(?=[\\s,!]|$)`, "g");
      if (motif.test(decl.value)) {
        decl.value = decl.value.replace(
          motif,
          (_correspondance, prefixe) => `${prefixe}${apres}`
        );
      }
    }
  });
}

// ── 2. Les URL de la police pointent vers l'emplacement public du jeu ─────
//
// Le build Vite produit une URL RELATIVE (`../fonts/blackline.woff`) : elle
// est correcte dans `dist/`, mais fausse sous `/blackline/` (elle désignerait
// `/fonts/…` à la racine de l'hôte). Elle doit viser l'emplacement public du
// jeu, sans quoi la police ne se charge pas.
racine.walkDecls((decl) => {
  if (decl.prop !== "src" && !decl.value.includes("url(")) {
    return;
  }
  decl.value = decl.value.replace(
    /url\((['"]?)(?:\.\.\/|\.\/)?fonts\/blackline\.woff(['"]?)\)/g,
    (_correspondance, prefixe, suffixe) =>
      `url(${prefixe}${POLICE_PUBLIQUE}${suffixe})`
  );
});

// ── 3. Re-ancrage des sélecteurs ───────────────────────────────────────────
let reglesAncrees = 0;
let selecteursAncrees = 0;
let declarationsConverties = 0;

racine.walkRules((regle) => {
  if (dansKeyframes(regle)) return;

  const origine = decouperSelecteurs(regle.selector);
  const ancres = ancrerListe(regle.selector);

  // `body { overflow-x: hidden }` : le seul cas où une déclaration change de
  // valeur, parce que la cible n'est plus le document mais un élément.
  if (origine.includes("body")) {
    regle.walkDecls((decl) => {
      const remplacement = DECLARATIONS_BODY[decl.prop];
      if (remplacement) {
        decl.value = remplacement;
        declarationsConverties++;
      }
    });
  }

  // `position: fixed` → `position: absolute` : le canvas et l'overlay doivent
  // être bornés par la racine du jeu, pas par le viewport.
  regle.walkDecls((decl) => {
    if (
      decl.prop === POSITION_FIXE &&
      decl.value.trim().toLowerCase() === VALEUR_FIXE
    ) {
      decl.value = VALEUR_ABSOLU;
      declarationsConverties++;
    }
  });

  // Les sélecteurs restent un par ligne, alignés sur la règle : le fichier est
  // généré, mais il est lu (revue, débogage) et doit rester lisible.
  const indentation = (regle.raws.before ?? "\n").split("\n").pop() ?? "";
  regle.selector = ancres.join(`,\n${indentation}`);
  reglesAncrees++;
  selecteursAncrees += ancres.length;

  // Contrôle immédiat : rien ne sort de la portée sans être dans la table.
  for (const selecteur of ancres) {
    if (
      !(dejaAncre(selecteur) || EXCEPTIONS.some((e) => e.motif.test(selecteur)))
    ) {
      echecs.push(
        `${regle.source.start.line} : « ${selecteur} » n'a pas été ancré`
      );
    }
  }
});

// ── 4. Garde-fous : aucun sélecteur document ne doit survivre ─────────────
const DOCUMENT = /(?:^|[\s>+~,])(html|body|:root)(?=$|[\s>+~.:[,{])/;
racine.walkRules((regle) => {
  if (dansKeyframes(regle)) return;
  for (const selecteur of decouperSelecteurs(regle.selector)) {
    if (DOCUMENT.test(selecteur)) {
      echecs.push(
        `${regle.source.start.line} : sélecteur document résiduel « ${selecteur} »`
      );
    }
  }
});

// ── 5. La police est déclarée APRÈS le renommage, avec la bonne URL ───────
racine.walkAtRules("font-face", (atRule) => {
  atRule.walkDecls((decl) => {
    if (decl.prop === "src") {
      decl.value = decl.value.replace(
        /url\((['"]?)(?:\.\.\/|\.\/)?fonts\/blackline\.woff(['"]?)\)/g,
        (_correspondance, prefixe, suffixe) =>
          `url(${prefixe}${POLICE_PUBLIQUE}${suffixe})`
      );
    }
  });
});

if (echecs.length > 0) echouer(echecs);

// ── 6. Écriture ─────────────────────────────────────────────────────────────
const ENTETE = `/* ============================================================================
 * BLACKLINE — FEUILLE DE STYLE RE-ANCRÉE SOUS .blackline-root
 * ============================================================================
 *
 * FICHIER GÉNÉRÉ — NE PAS ÉDITER À LA MAIN.
 * Source : apps/blackline/dist/assets/*.css · Script : scripts/build-blackline-css.mjs
 *
 * Chaque sélecteur du jeu est ancré sous .blackline-root, l'élément posé par
 * la page hôte autour de l'arbre /blackline (app/(chat)/blackline/**). Sans cet
 * ancrage, les bases du jeu (html, body, :root) et ses composants (button,
 * input, select) repeindraient le chat, la barre latérale et les réglages de
 * l'hôte.
 *
 * Deux transformations en plus du ré-ancrage :
 *   - « position: fixed » devient « position: absolute » : le canvas et
 *     l'overlay d'orientation doivent être bornés par le JEU, pas par le
 *     viewport — sinon ils couvriraient la barre latérale du chat ;
 *   - les « @keyframes » sont préfixés « blackline- » : leurs noms (« pulse »,
 *     « loading »…) sont globaux, et l'interface mAI ne doit pas les hériter.
 *
 * Le fichier est importé par app/(chat)/blackline/layout.tsx et par lui seul.
 * Il est exclu du lint (biome.jsonc) : c'est une sortie de script.
 *
 * Relancer après toute modification du jeu :
 *   node scripts/build-blackline.mjs && node scripts/build-blackline-css.mjs
 * ============================================================================ */

`;

// Le dossier de sortie est créé s'il manque : le script doit pouvoir être
// lancé sur un dépôt frais, sans étape manuelle.
mkdirSync(dirname(SORTIE), { recursive: true });
writeFileSync(SORTIE, `${ENTETE}${racine.toString().trim()}\n`);

const relatif = SORTIE.slice(RACINE.length + 1).replace(/\\/g, "/");
console.log(
  `✓ ${relatif} — ${reglesAncrees} règles, ${selecteursAncrees} sélecteurs`
);
console.log(
  `  ${renommages.size} animation(s) renommée(s) (${[...renommages.keys()].join(", ") || "aucune"}), ${declarationsConverties} déclaration(s) convertie(s).`
);
