#!/usr/bin/env node
/**
 * ============================================================================
 * CONSTRUCTION DES FEUILLES DE STYLE WAKIES POUR L'HÔTE mAI
 * ============================================================================
 *
 * POURQUOI CE SCRIPT
 *
 * Wakies arrive avec deux feuilles écrites pour une application Vite qui
 * possède le document entier (`apps/wakies/integration/web/style.css`,
 * `editor.css`). Trois de leurs mécanismes sont inacceptables tels quels dans
 * l'hôte :
 *
 *   1. `:root` y porte le thème clair de Wakies (fond #f8f7f4, texte #333641)
 *      et ses jetons. Dans l'hôte, `:root` EST le document : cette feuille
 *      repeindrait le chat, la barre latérale et les réglages.
 *
 *   2. `body { margin: 0 }` et les bases qu'il portait (police, couleur de
 *      texte) s'appliqueraient à toute la page.
 *
 *   3. Les composants sont sur des sélecteurs nus (`button`, `input`,
 *      `.sidebar`, `.template-app`…). Rien n'est préfixé : chaque règle
 *      s'appliquerait à l'application ENTIÈRE, y compris aux boutons de la
 *      barre latérale mAI.
 *
 * L'APPROCHE
 *
 * On ne change pas le design de Wakies : on change la PORTÉE de chaque règle.
 * Le fichier est lu en AST (PostCSS — même chaîne que Turbopack, donc aucun
 * analyseur maison à maintenir), puis chaque liste de sélecteurs est re-ancrée
 * sous `.wakies-root`, l'élément posé par app/(wakies)/wakies/layout.tsx autour
 * de tout l'arbre Wakies.
 *
 * La correspondance est une TABLE, pas une suite de « remplacements » :
 *
 *   :root, html, body             → .wakies-root        (ils PORTENT le thème)
 *   html.x, html[x]               → .wakies-root.x
 *   [data-…] X                    → .wakies-root[data-…] X
 *   button / .sidebar / ::-webkit-scrollbar / * → .wakies-root <sélecteur>
 *
 * Les valeurs, les animations et les classes sont conservées telles quelles.
 * Aucune variante sombre n'est introduite : Wakies est son propre thème clair,
 * il n'utilise ni Tailwind ni `prefers-color-scheme`.
 *
 * GARDE-FOUS : le script ÉCHOUE (code 1) plutôt que d'écrire une feuille
 * partielle. Une règle qui n'a pas pu être ancrée, un sélecteur document
 * résiduel, une source disparue : tout est signalé, et rien n'est écrit.
 *
 * SORTIES : components/wakies/wakies.css et components/wakies/wakies-editor.css
 * — importés par app/(wakies)/wakies/layout.tsx et par lui seul. Ces fichiers
 * sont générés : ils sont EXCLUS du lint (biome.jsonc), comme
 * components/vibe/vibe.css.
 *
 * Relancer après toute modification des sources :
 *   node scripts/build-wakies-css.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import postcss from "postcss";

const RACINE = resolve(import.meta.dirname, "..");

/** Élément porteur de Wakies dans l'hôte — le sujet de toutes les règles. */
const PORTEUR = ".wakies-root";

/** Sources → sorties. L'ordre d'import dans le layout doit suivre cet ordre. */
const FEUILLES = [
  {
    sortie: "components/wakies/wakies-ui.css",
    source: "packages/ui/dist/styles.css",
    ui: true,
  },
  {
    sortie: "components/wakies/wakies.css",
    source: "apps/wakies/integration/web/style.css",
  },
  {
    sortie: "components/wakies/wakies-editor.css",
    source: "apps/wakies/integration/web/editor.css",
  },
];

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

/** Où atterrissent les at-rules dont les « sélecteurs » ne sont pas des sélecteurs. */
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
  return /^\.wakies-root(?![\w-])/.test(selecteur);
}

/**
 * Découpe un sélecteur en [tête, reste] : la tête est le premier sélecteur
 * composé, le reste commence au premier combinateur.
 *
 * La découpe ne s'arrête ni dans les parenthèses (`:where(a b)`) ni dans les
 * crochets ni dans les chaînes : une tête fausse produit un sélecteur faux.
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
 * Tête de sélecteur ramenée à la racine Wakies.
 *
 *   html | body | :root   → la racine elle-même (elle PORTE le thème, les jetons
 *                            et la surface que `<body>` portait) ;
 *   html.light | html[x]  → .wakies-root.light | .wakies-root[x] ;
 *   [data-…]              → attribut porté par la racine, donc en composé ;
 *   tout le reste         → descendant : .wakies-root <tête>.
 */
function ancrerTete(tete) {
  if (tete === "html" || tete === "body" || tete === ":root") return PORTEUR;
  if (tete.startsWith("html")) return `${PORTEUR}${tete.slice(4)}`;
  if (tete.startsWith("[")) return `${PORTEUR}${tete}`;
  if (dejaAncre(tete)) return tete;
  return `${PORTEUR} ${tete}`;
}

/**
 * Ancre UN sélecteur sous `.wakies-root`.
 *
 * `html body` mérite son cas : dans l'app Vite la règle visait le `<body>`, qui
 * portait la surface de Wakies. Ici le porteur EST la racine — le `body` final
 * est donc absorbé, sinon le sélecteur chercherait un `<body>` inexistant sous
 * `.wakies-root` et la règle ne s'appliquerait jamais.
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
  console.error(
    "✗ feuilles Wakies NON générées — la portée serait incomplète :"
  );
  for (const message of messages) console.error(`  ${message}`);
  process.exit(1);
}

for (const feuille of FEUILLES) {
  const source = resolve(RACINE, feuille.source);
  const sortie = resolve(RACINE, feuille.sortie);

  if (!existsSync(source)) {
    echouer([
      `source introuvable : ${feuille.source}`,
      "apps/wakies est le dépôt source du port ; sans lui, la feuille ne peut pas être régénérée.",
    ]);
  }

  const racine = postcss.parse(readFileSync(source, "utf8"), { from: source });
  if (feuille.ui) {
    racine.walkAtRules("font-face", (rule) => rule.remove());
    racine.walkAtRules("media", (rule) => {
      if (rule.params.includes("prefers-color-scheme: dark")) rule.remove();
    });
  }
  // Les identifiants de keyframes sont globaux : les préfixer protège les autres applications.
  const animations = new Map();
  const prefixe = feuille.sortie.split("/").pop().replace(".css", "");
  racine.walkAtRules((regle) => {
    if (!regle.name.endsWith("keyframes")) return;
    const nom = regle.params.trim();
    const nouveau = `${prefixe}-${nom}`;
    animations.set(nom, nouveau);
    regle.params = nouveau;
  });
  racine.walkDecls((declaration) => {
    if (!/^(?:-webkit-)?animation(?:-name)?$/.test(declaration.prop)) return;
    for (const [nom, nouveau] of animations) {
      declaration.value = declaration.value
        .split(/([\s,])/)
        .map((morceau) => (morceau === nom ? nouveau : morceau))
        .join("");
    }
  });
  const echecs = [];
  let reglesAncrees = 0;
  let selecteursAncrees = 0;

  racine.walkRules((regle) => {
    if (dansKeyframes(regle)) return;

    const ancres = ancrerListe(regle.selector);

    // Les sélecteurs restent un par ligne, alignés sur la règle : le fichier
    // est généré, mais il est lu (revue, débogage) et doit rester lisible.
    const indentation = (regle.raws.before ?? "\n").split("\n").pop() ?? "";
    regle.selector = ancres.join(`,\n${indentation}`);
    reglesAncrees++;
    selecteursAncrees += ancres.length;

    for (const selecteur of ancres) {
      if (
        !(
          dejaAncre(selecteur) ||
          EXCEPTIONS.some((e) => e.motif.test(selecteur))
        )
      ) {
        echecs.push(
          `${feuille.source}:${regle.source.start.line} : « ${selecteur} » n'a pas été ancré`
        );
      }
    }
  });

  // Garde-fou : aucun sélecteur document ne doit survivre.
  const DOCUMENT = /(?:^|[\s>+~,])(html|body|:root)(?=$|[\s>+~.:[,{])/;
  racine.walkRules((regle) => {
    if (dansKeyframes(regle)) return;
    for (const selecteur of decouperSelecteurs(regle.selector)) {
      if (DOCUMENT.test(selecteur)) {
        echecs.push(
          `${feuille.source}:${regle.source.start.line} : sélecteur document résiduel « ${selecteur} »`
        );
      }
    }
  });

  if (echecs.length > 0) echouer(echecs);

  const entete = `/* ============================================================================
 * WAKIES — FEUILLE DE STYLE RE-ANCRÉE SOUS ${PORTEUR}
 * ============================================================================
 *
 * FICHIER GÉNÉRÉ — NE PAS ÉDITER À LA MAIN.
 * Source : ${feuille.source} · Script : scripts/build-wakies-css.mjs
 *
 * Chaque sélecteur de Wakies est ancré sous ${PORTEUR}, l'élément posé par
 * app/(wakies)/wakies/layout.tsx autour de l'arbre /wakies. Sans cet ancrage,
 * le thème clair de Wakies (${PORTEUR} porte :root) et ses sélecteurs nus
 * (button, input, .sidebar…) repeindraient le chat, la barre latérale et les
 * réglages de l'hôte.
 *
 * Importé par app/(wakies)/wakies/layout.tsx et par lui seul.
 * Exclu du lint (biome.jsonc) : c'est une sortie de script.
 *
 * Relancer après toute modification de la source :
 *   node scripts/build-wakies-css.mjs
 * ============================================================================ */

`;

  if (!feuille.ui) {
    // Les primitives du paquet gardent la priorité sur les anciens contrôles nus.
    const couche = postcss.atRule({ name: "layer", params: "wakies-base" });
    couche.append([...racine.nodes]);
    racine.append(couche);
  }
  racine.prepend(
    postcss.atRule({ name: "layer", params: "wakies-base, mdevs" })
  );
  writeFileSync(sortie, `${entete}${racine.toString().trim()}\n`);
  console.log(
    `✓ ${feuille.sortie} — ${reglesAncrees} règles, ${selecteursAncrees} sélecteurs`
  );
}
