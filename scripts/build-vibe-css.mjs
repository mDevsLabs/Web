#!/usr/bin/env node
/**
 * ============================================================================
 * CONSTRUCTION DE LA FEUILLE DE STYLE VIBE POUR L'HÔTE mAI
 * ============================================================================
 *
 * POURQUOI CE SCRIPT
 *
 * Vibe arrive avec une feuille de style écrite pour une application Vite qui
 * possède le document entier (`apps/vibe/src/index.css`). Trois de ses
 * mécanismes sont inacceptables tels quels dans l'hôte :
 *
 *   1. `@import "tailwindcss"` — l'hôte importe déjà Tailwind (app/globals.css).
 *      Un second import dupliquerait la couche de base.
 *
 *   2. Elle REMAPPE la palette Tailwind sur `:root` :
 *        --color-zinc-900: #f1f5f9   (en clair : la palette est INVERSÉE)
 *        --color-zinc-50:  #000000
 *      Écrit sur `:root`, ce remappage repeint TOUTES les pages de l'hôte : le
 *      chat, la barre latérale, les réglages. C'est aussi une inversion PORTÉE
 *      PAR LE THÈME (`html.light` / `html.dark`) : la même classe Tailwind n'a
 *      pas la même couleur selon le thème, donc « redéfinir la valeur » ne
 *      suffit pas — il faut changer le SUJET de la règle.
 *
 *   3. Elle pose son thème et ses bases sur `html`, `body` et `:root`, et ses
 *      composants sur des sélecteurs nus (`.rich-content`, `.vibe-chat-*`,
 *      `button`, `::-webkit-scrollbar`…). Rien de tout cela n'est préfixé : dans
 *      l'hôte, chaque règle s'appliquerait à l'application ENTIÈRE.
 *
 * L'APPROCHE
 *
 * On ne change pas le design de Vibe : on change la PORTÉE de chaque règle.
 * Le fichier est lu en AST (PostCSS — même chaîne que Turbopack, donc aucun
 * analyseur maison à maintenir), puis chaque liste de sélecteurs est re-ancrée
 * sous `.vibe-root`, l'élément que pose `ThemeProvider`
 * (lib/vibe/context/ThemeContext.tsx) autour de tout l'arbre Vibe.
 *
 * La correspondance est une TABLE, pas une suite de « remplacements » :
 *
 *   :root, html, body                  → .vibe-root
 *   html.light   X                     → .vibe-root.light   X
 *   html.dark    X                     → .vibe-root.dark    X
 *   [data-theme="light"] X             → .vibe-root[data-theme="light"] X
 *   html.light body                    → .vibe-root.light      (le porteur est
 *   [data-theme="dark"] body           → .vibe-root[data-theme="dark"]  la racine)
 *   .rich-content / button / ::-webkit-scrollbar / * → .vibe-root <sélecteur>
 *
 * Les valeurs, les animations et les classes sont conservées telles quelles.
 *
 * CE QUI EST RETIRÉ
 *
 *   - `@import "tailwindcss"` (le socle vient de l'hôte) ;
 *   - le bloc `@theme` (ses deux polices) : `--font-sans` est un jeton de
 *     l'hôte, exposé par `next/font` dans app/layout.tsx. Vibe reçoit sa propre
 *     pile `--vibe-font-sans`, posée sous `.vibe-root`, qui RÉUTILISE le jeton
 *     de l'hôte : sans cela, le littéral « Plus Jakarta Sans » ne correspondrait
 *     à rien (next/font expose un nom de famille généré) et la police ne se
 *     chargerait jamais.
 *
 * CE QUI EST RÉÉCRIT
 *
 *   - `@custom-variant dark` : la variante par défaut (`&:is(.dark, .dark *)`)
 *     s'allumerait dès que le thème sombre de l'hôte est posé sur `<html>`,
 *     alors que Vibe est en thème clair. Elle est ré-ancrée sur la racine Vibe.
 *   - `overflow-x: hidden` de `body` → `clip` : `hidden` ferait de `.vibe-root`
 *     un conteneur de défilement (`overflow-y` passe à `auto`), et les
 *     en-têtes `sticky` de Vibe ne colleraient plus. `clip` coupe le débordement
 *     horizontal sans créer de scrollport.
 *   - `var(--font-sans)` / `var(--font-mono)` → `--vibe-font-*`, pour la même
 *     raison que ci-dessus ;
 *   - l'at-rule `@custom-variant dark` : Tailwind ne lit que app/globals.css,
 *     où la variante est déclarée sous le nom `vibe-dark` — le seul que les
 *     composants Vibe emploient. La laisser ici ne l'enregistrerait pas.
 *
 * LES DEUX EXCEPTIONS, EXPLICITES ET VÉRIFIÉES
 *
 *   - `::view-transition-old(root)` / `::view-transition-new(root)` : ces
 *     pseudo-éléments n'existent qu'au niveau du document ; les ancrer les
 *     rendrait inertes. Ils ne s'appliquent que pendant une transition de vue.
 *   - `[data-animations="off"] *` : la règle est ancrée comme les autres, mais
 *     elle suppose que le service `animationPrefs` pose l'attribut sur la
 *     RACINE Vibe et non sur `<html>` — sinon elle ne se déclencherait jamais.
 *     Voir lib/vibe/services/animationPrefs.ts.
 *
 * GARDE-FOUS : le script ÉCHOUE (code 1) plutôt que d'écrire une feuille
 * partielle. Une règle qui n'a pas pu être ancrée, un sélecteur document
 * résiduel, une source disparue : tout est signalé, et rien n'est écrit.
 *
 * SORTIE : components/vibe/vibe.css — importé par app/(chat)/vibe/layout.tsx
 * et par lui seul. Le fichier est généré : il est EXCLU du lint (biome.jsonc),
 * comme les catalogues `lib/plugins/*.generated.ts`.
 *
 * Relancer après toute modification de la source :
 *   node scripts/build-vibe-css.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import postcss from "postcss";

const RACINE = resolve(import.meta.dirname, "..");
const SOURCE = resolve(RACINE, "apps/vibe/src/index.css");
const SORTIE = resolve(RACINE, "components/vibe/vibe.css");

/** Élément porteur de Vibe dans l'hôte — le sujet de toutes les règles. */
const PORTEUR = ".vibe-root";

/**
 * Sélecteurs laissés tels quels, avec leur raison. Toute autre règle non ancrée
 * fait échouer la génération.
 */
const EXCEPTIONS = [
  {
    motif: /^::view-transition-(old|new)\(root\)$/,
    raison:
      "pseudo-élément du document : l'ancrer le rendrait inerte. N'existe que le temps d'une transition de vue.",
  },
];

/**
 * Déclarations du `<body>` Vite qui changent de sens sur `.vibe-root`.
 * Voir l'en-tête : `hidden` créerait un conteneur de défilement.
 */
const DECLARATIONS_BODY = { "overflow-x": "clip" };

/** Sélecteur vers `var()` à réécrire, pour ne pas toucher aux autres. */
const JETONS_POLICE = [
  ["var(--font-sans)", "var(--vibe-font-sans)"],
  ["var(--font-mono)", "var(--vibe-font-mono)"],
];

/** Où atterrissent les at-rules dont les sélecteurs ne sont pas des sélecteurs. */
const AT_RULES_SANS_SELECTEUR = new Set(["keyframes", "font-face", "property"]);

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
 * `selector.split(",")` serait faux : les `:not(.a, .b)` et les valeurs
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
  return /^\.vibe-root(?![\w-])/.test(selecteur);
}

/**
 * Découpe un sélecteur en [tête, reste] : la tête est le premier sélecteur
 * composé, le reste commence au premier combinateur.
 *
 * La découpe ne s'arrête ni dans les parenthèses (`:where(a b)`, `:not(.x, .y)`)
 * ni dans les crochets ni dans les chaînes : ce sont les mêmes pièges que pour la
 * découpe de liste, et une tête fausse produit un sélecteur faux. Une tête peut
 * donc légitimement contenir des espaces (`:where(button, a):focus-visible`).
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
 * Tête de sélecteur ramenée à la racine Vibe.
 *
 *   html | body | :root      → la racine elle-même (elle PORTE le thème, les
 *                              jetons et la surface que `<body>` portait) ;
 *   html.light | html[x]     → .vibe-root.light | .vibe-root[x] ;
 *   [data-theme] | [data-…]  → attribut porté par la racine (thème, animations),
 *                              donc en composé : .vibe-root[data-…] ;
 *   tout le reste            → descendant : .vibe-root <tête>.
 */
function ancrerTete(tete) {
  if (tete === "html" || tete === "body" || tete === ":root") return PORTEUR;
  if (tete.startsWith("html")) return `${PORTEUR}${tete.slice(4)}`;
  if (tete.startsWith("[")) return `${PORTEUR}${tete}`;
  if (dejaAncre(tete)) return tete;
  return `${PORTEUR} ${tete}`;
}
/**
 * Ancre UN sélecteur sous `.vibe-root`.
 *
 * `html.light body` mérite son cas : dans l'app Vite la règle visait le `<body>`,
 * qui portait la surface de Vibe. Ici le porteur EST la racine — le `body` final
 * est donc absorbé, sinon le sélecteur chercherait un <body> inexistant sous
 * `.vibe-root` et la règle ne s'appliquerait jamais.
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

function echouer(messages) {
  console.error("✗ vibe.css NON généré — la portée serait incomplète :");
  for (const message of messages) console.error(`  ${message}`);
  process.exit(1);
}

if (!existsSync(SOURCE)) {
  echouer([
    `source introuvable : ${SOURCE}`,
    "apps/vibe est le dépôt source du port ; sans lui, la feuille ne peut pas être régénérée.",
  ]);
}

const racine = postcss.parse(readFileSync(SOURCE, "utf8"), { from: SOURCE });
const echecs = [];

// ── 1. Le socle Tailwind vient de l'hôte ────────────────────────────────────
racine.walkAtRules("import", (atRule) => {
  if (/["']tailwindcss["']/.test(atRule.params)) atRule.remove();
});

// ── 2. L'@theme (polices) part : les jetons de l'hôte restent intacts ───────
racine.walkAtRules("theme", (atRule) => atRule.remove());

// ── 3. La variante `dark:` de Vibe ne peut pas vivre ici ────────────────────
//
// Tailwind ne traite QUE app/globals.css : dans ce fichier, `@custom-variant`
// n'est pas enregistré (Turbopack le signale « Unknown at rule ») et les
// classes `dark:*` des composants retomberaient sur la variante de l'hôte, qui
// suit `<html>` — un composant Vibe en thème clair virerait au sombre dès que
// l'hôte est sombre. La variante est donc déclarée dans app/globals.css sous le
// nom `vibe-dark`, que les composants Vibe emploient (354 classes).
racine.walkAtRules("custom-variant", (atRule) => {
  if (atRule.params.trim().startsWith("dark")) atRule.remove();
});

// ── 4. Re-ancrage des sélecteurs ────────────────────────────────────────────
let reglesAncrees = 0;
let selecteursAncrees = 0;
let declarationsReecrites = 0;

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
        declarationsReecrites++;
      }
    });
  }

  regle.walkDecls((decl) => {
    for (const [avant, apres] of JETONS_POLICE) {
      if (decl.value.includes(avant))
        decl.value = decl.value.split(avant).join(apres);
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

// ── 5. Les jetons de police de Vibe, posés sous la racine ───────────────────
const polices = postcss.parse(`
${PORTEUR} {
  --vibe-font-sans: var(--font-sans, 'Plus Jakarta Sans'), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --vibe-font-mono: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}`).nodes;
racine.prepend(polices);

// ── 6. Garde-fous : aucun sélecteur document ne doit survivre ───────────────
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
racine.walkAtRules((atRule) => {
  if (/["']tailwindcss["']/.test(atRule.params)) {
    echecs.push(`ligne ${atRule.source.start.line} : import Tailwind résiduel`);
  }
  if (atRule.name === "theme") {
    echecs.push(`ligne ${atRule.source.start.line} : bloc @theme résiduel`);
  }
  if (atRule.name === "custom-variant") {
    echecs.push(
      `ligne ${atRule.source.start.line} : @custom-variant résiduel (non traité par Tailwind, voir app/globals.css)`
    );
  }
});

if (echecs.length > 0) echouer(echecs);

// ── 7. Écriture ─────────────────────────────────────────────────────────────
const ENTETE = `/* ============================================================================
 * VIBE — FEUILLE DE STYLE RE-ANCRÉE SOUS .vibe-root
 * ============================================================================
 *
 * FICHIER GÉNÉRÉ — NE PAS ÉDITER À LA MAIN.
 * Source : apps/vibe/src/index.css · Script : scripts/build-vibe-css.mjs
 *
 * Chaque sélecteur de Vibe est ancré sous .vibe-root, l'élément posé par
 * ThemeProvider autour de l'arbre /vibe (app/(chat)/vibe/**). Sans cet
 * ancrage, le remappage de la palette Tailwind (--color-zinc-*, --color-black,
 * --color-white) et les règles de base (html, body, :root) de Vibe
 * repeindraient le chat, la barre latérale et les réglages de l'hôte.
 *
 * Le fichier est importé par app/(chat)/vibe/layout.tsx et par lui seul.
 * Il est exclu du lint (biome.jsonc) : c'est une sortie de script.
 *
 * Relancer après toute modification de la source :
 *   node scripts/build-vibe-css.mjs
 * ============================================================================ */

`;

writeFileSync(SORTIE, `${ENTETE}${racine.toString().trim()}\n`);

const relatif = SORTIE.slice(RACINE.length + 1).replace(/\\/g, "/");
console.log(
  `✓ ${relatif} — ${reglesAncrees} règles, ${selecteursAncrees} sélecteurs`
);
console.log(
  `  ${declarationsReecrites} déclaration(s) réécrite(s) (overflow-x de body), ${EXCEPTIONS.length} famille(s) laissée(s) globale(s).`
);
