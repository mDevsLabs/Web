#!/usr/bin/env node
/**
 * ============================================================================
 * ALLÈGEMENT DES ICÔNES DE LABORATOIRES
 * ============================================================================
 *
 * POURQUOI CE SCRIPT
 *
 * Les icônes de `public/models/` sont dessinées à 24 × 24 mais ont été
 * vectorisées depuis des logos de 200 × 200 : leurs tracés conservent une
 * précision de trois décimales, et les marques les plus complexes (Sao10K,
 * Anthracite, The Drummer) comptent des dizaines de chemins. Le dossier
 * pèsait 308 Ko pour 35 icônes — soit 9 Ko par icône, pour un affichage à
 * 16 px où un pixel de l'écran couvre 1,5 unité du viewBox.
 *
 * L'APPROCHE
 *
 * Aucune perte de dessin visible, seulement de la précision invisible :
 *
 *   1. Les métadonnées (`<title>`, `<desc>`, `role`, `aria-label`) sont
 *      retirées : le nom accessible est porté par l'attribut `alt` de
 *      l'image, qui est l'élément réellement exposé au lecteur d'écran.
 *   2. Les tracés sont réécrits à une précision adaptée à leur échelle. Le
 *      point de départ est mesuré, pas supposé : une icône dont le tracé vit
 *      dans un viewBox de 200 unités ramené à 22 unités n'a besoin que d'une
 *      décimale, là où une icône dessinée directement en 24 unités en garde
 *      deux.
 *   3. Les espaces entre balises sont supprimés.
 *
 * LE POINT DÉLICAT : LE FORMAT COMPACT DES TRACÉS
 *
 * Un tracé SVG n'est pas une suite de nombres séparés par des espaces. Le
 * format compact est la règle : `c.047.003.091` vaut trois nombres (0,047 ;
 * 0,003 ; 0,091), et `a1.06 1.06 0 01.716` mêle des/drapeaux d'arc et des
 * nombres. Une expression régulière naïve confond les deux : appliquée telle
 * quelle, elle fusionnait deux nombres en un et DÉFORMait le dessin.
 *
 * Le script analyse donc le tracé selon la grammaire du SVG (commandes,
 * nombres, drapeaux d'arc) avant de le réécrire.
 *
 * L'UTILISATION
 *
 *   node scripts/optimize-model-logos.mjs
 *   node scripts/optimize-model-logos.mjs --check   (échoue si le dossier
 *                                                     n'est pas optimisé)
 * ============================================================================
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DOSSIER = "public/models";

/** Un nombre SVG : signe optionnel, puis chiffres, puis fraction et exposant. */
const NOMBRE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;

/**
 * Nombre d'arguments de chaque commande de tracé.
 *
 * Indispensable : une commande peut se répéter implicitement. `a.062.062 0
 * 01.003.023 2.592 2.592 0 01-.068.463` est DEUX arcs, pas un seul avec
 * quatorze arguments : sans cette table, les drapeaux du second arc
 * n'étaient plus reconnus et le tracé était déformé.
 */
const ARGS_COMMANDE = {
  A: 7,
  a: 7,
  C: 6,
  c: 6,
  H: 1,
  h: 1,
  L: 2,
  l: 2,
  M: 2,
  m: 2,
  Q: 4,
  q: 4,
  S: 4,
  s: 4,
  T: 2,
  t: 2,
  V: 1,
  v: 1,
  Z: 0,
  z: 0,
};

/** Décimales conservées, par échelle effective du tracé. */
const DECIMALES_PLEINE = 2;
const DECIMALES_REDUITE = 1;

function estEspace(c) {
  return c === " " || c === "\n" || c === "\r" || c === "\t" || c === ",";
}

/**
 * Analyse un tracé selon la grammaire du SVG.
 *
 * Les drapeaux d'arc sont lus comme un caractère isolé : c'est la seule
 * partie de la grammaire qu'une lecture « nombre » naïve rate, et c'est
 * elle qui fait qu'un tracé d'arc se retrouve avec de mauvaises coordonnées.
 */
function analyserTracé(source) {
  const jetons = [];
  let commande = null;
  let index = 0;
  let argumentsDepuisCommande = 0;

  /** Clôt un groupe d'arguments : le suivant reprend à zéro. */
  const cloturer = () => {
    const total = ARGS_COMMANDE[commande];
    if (total && argumentsDepuisCommande >= total) {
      argumentsDepuisCommande = 0;
    }
  };

  while (index < source.length) {
    const caractere = source[index];

    if (estEspace(caractere)) {
      index += 1;
      continue;
    }

    if (/[a-zA-Z]/.test(caractere)) {
      commande = caractere;
      argumentsDepuisCommande = 0;
      jetons.push({ type: "cmd", valeur: caractere });
      index += 1;
      continue;
    }

    // Drapeaux d'arc : quatrième et cinquième arguments de `a`/`A`.
    const estArc = commande === "a" || commande === "A";
    if (
      estArc &&
      (argumentsDepuisCommande === 3 || argumentsDepuisCommande === 4) &&
      (caractere === "0" || caractere === "1")
    ) {
      jetons.push({ type: "flag", valeur: caractere });
      argumentsDepuisCommande += 1;
      cloturer();
      index += 1;
      continue;
    }

    const reste = source.slice(index);
    const trouve = reste.match(NOMBRE);
    if (!trouve) {
      throw new Error(`Tracé illisible : « ${reste.slice(0, 24)} »`);
    }
    jetons.push({ type: "num", valeur: Number(trouve[0]) });
    argumentsDepuisCommande += 1;
    cloturer();
    index += trouve[0].length;
  }

  return jetons;
}

/** Écrit un nombre sans zéros inutiles. */
function formater(valeur, decimales) {
  if (!Number.isFinite(valeur)) {
    return "0";
  }
  const arrondi = Number(valeur.toFixed(decimales));
  return Object.is(arrondi, -0) ? "0" : String(arrondi);
}

/** Réécrit un tracé arrondi, en conservant les séparateurs. */
function serialiser(jetons, decimales) {
  let sortie = "";
  let precedent = null;

  for (const jeton of jetons) {
    if (jeton.type === "cmd") {
      sortie += jeton.valeur;
      precedent = "cmd";
      continue;
    }
    if (jeton.type === "flag") {
      if (precedent === "num" || precedent === "flag") {
        sortie += " ";
      }
      sortie += jeton.valeur;
      precedent = "flag";
      continue;
    }
    const texte = formater(jeton.valeur, decimales);
    if (precedent === "num" || precedent === "flag") {
      // Un signe « - » suffit à séparer deux nombres ; un espace est sinon
      // nécessaire, et sans risque pour le lecteur de tracé.
      if (!texte.startsWith("-")) {
        sortie += " ";
      }
    }
    sortie += texte;
    precedent = "num";
  }

  return sortie;
}

/**
 * Échelle effective d'un tracé.
 *
 * Les icônes embarquées sont vectorisées depuis des logos de 200 × 200,
 * insérés dans un viewBox interne réduit à 22 unités : une décimale y vaut
 * 0,11 unité du viewBox extérieur, donc 0,007 pixel à l'écran. Les icônes
 * dessinées directement en 24 unités, elles, ne peuvent pas perdre de
 * décimale.
 *
 * L'échelle se lit sur le `<svg>` le plus interne : c'est lui qui contient
 * les tracés.
 */
function echelleTracé(svg) {
  const balises = [...svg.matchAll(/<svg[^>]*>/g)].map((m) => m[0]);
  for (let i = balises.length - 1; i >= 0; i -= 1) {
    const viewBox = balises[i].match(/viewBox="0 0 ([\d.]+) [\d.]+"/);
    const largeur = balises[i].match(/\swidth="([\d.]+)"/);
    if (!viewBox || !largeur) {
      continue;
    }
    const rapport = Number(largeur[1]) / Number(viewBox[1]);
    if (Number.isFinite(rapport) && rapport > 0) {
      return rapport;
    }
  }
  return 1;
}

/** Allège un SVG. */
function optimiser(svg) {
  let sortie = svg;

  // Métadonnées : le nom accessible est porté par l'attribut `alt` de l'image.
  sortie = sortie.replace(/<title>[\s\S]*?<\/title>/g, "");
  sortie = sortie.replace(/<desc>[\s\S]*?<\/desc>/g, "");
  sortie = sortie.replace(/\s+role="[^"]*"/g, "");
  sortie = sortie.replace(/\s+aria-label="[^"]*"/g, "");
  sortie = sortie.replace(/<!--[\s\S]*?-->/g, "");

  // Précision des tracés, adaptée à leur échelle.
  const echelle = echelleTracé(sortie);
  const decimales = echelle < 0.5 ? DECIMALES_REDUITE : DECIMALES_PLEINE;
  sortie = sortie.replace(/d="([^"]*)"/g, (_tout, trace) => {
    try {
      return `d="${serialiser(analyserTracé(trace), decimales)}"`;
    } catch {
      // Un tracé illisible est laissé tel quel : mieux vaut un fichier
      // lourd qu'un dessin déformé.
      return `d="${trace}"`;
    }
  });

  // Compaction : espaces entre balises, retours à la ligne, indentation.
  sortie = sortie.replace(/>\s+</g, "><");
  sortie = sortie.replace(/\s{2,}/g, " ");
  sortie = sortie.trim();

  return sortie;
}

const fichiers = readdirSync(DOSSIER)
  .filter((nom) => nom.endsWith(".svg"))
  .sort();

if (fichiers.length === 0) {
  console.error(`Aucun SVG dans ${DOSSIER}.`);
  process.exit(1);
}

const verification = process.argv.includes("--check");
let totalAvant = 0;
let totalApres = 0;
let modifies = 0;

for (const nom of fichiers) {
  const chemin = join(DOSSIER, nom);
  const avant = readFileSync(chemin, "utf8");
  const apres = optimiser(avant);

  totalAvant += avant.length;
  totalApres += apres.length;

  if (avant !== apres) {
    modifies += 1;
    if (!verification) {
      writeFileSync(chemin, apres, "utf8");
    }
  }
}

const kilo = (octets) => `${(octets / 1024).toFixed(1)} Ko`;
console.log(
  `Icônes : ${fichiers.length} fichiers, ${totalAvant} → ${totalApres} octets (${kilo(totalAvant)} → ${kilo(totalApres)}), ${modifies} modifiés.`
);

if (verification && modifies > 0) {
  console.error(
    "Les icônes ne sont pas optimisées. Lancez : node scripts/optimize-model-logos.mjs"
  );
  process.exit(1);
}
