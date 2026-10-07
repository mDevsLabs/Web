#!/usr/bin/env node
/**
 * ============================================================================
 * RÉÉCRITURE DES IMPORTS — Wakies vers l'arborescence hôte
 * ============================================================================
 *
 * Les fichiers de `apps/wakies/src/` sont COPIÉS vers deux racines du dépôt
 * hôte (la source Vite reste intacte et exécutable) :
 *
 *   src/client/**  →  components/wakies/**   (interface portée)
 *   src/shared/**  →  lib/wakies/shared/**  (types partagés client/serveur)
 *
 * Les imports d'origine sont relatifs et suffixés `.js` (convention Node du
 * gabarit). Chaque specifier est RÉSOLU depuis la position qu'il avait dans
 * `apps/wakies/`, puis réémis en alias `@/…` : une faute de compte dans un
 * `../` devient une erreur de script au lieu d'un import silencieusement cassé.
 *
 * RELIÈVE : ce script est ponctuel. Il ne réécrit que ce qui mène encore hors
 * des deux racines, donc le rejouer est sans effet une fois le port fait.
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const RACINE = resolve(import.meta.dirname, "..");
// Modules importés par le client ET le serveur (schémas de validation des
// pages) : ils vivent hors de `client/` et `shared/` mais restent purs, donc
// ils rejoignent les types des deux côtés.
const EXTRAS = [
  {
    alias: "@/lib/wakies/pages",
    depuis: resolve(RACINE, "apps/wakies/src/server/pages"),
  },
];

const SOURCES = [
  {
    alias: "@/components/wakies",
    depuis: resolve(RACINE, "apps/wakies/src/client"),
    hote: resolve(RACINE, "components/wakies"),
  },
  {
    alias: "@/lib/wakies/shared",
    depuis: resolve(RACINE, "apps/wakies/src/shared"),
    hote: resolve(RACINE, "lib/wakies/shared"),
  },
];

/** Liste récursive des fichiers TypeScript à traiter. */
function fichiersSous(dossier, sortie = []) {
  for (const nom of readdirSync(dossier)) {
    const chemin = resolve(dossier, nom);
    if (statSync(chemin).isDirectory()) {
      fichiersSous(chemin, sortie);
    } else if (/\.tsx?$/.test(nom)) {
      sortie.push(chemin);
    }
  }
  return sortie;
}

/**
 * Traduit un chemin absolu de la SOURCE en alias `@/…`, ou null s'il sort du
 * périmètre. Les séparateurs sont normalisés avant comparaison : sous Windows
 * `resolve` produit des antislashs et `racine + '/'` ne matcherait jamais.
 */
function versAlias(cheminSource) {
  const cible = cheminSource.replaceAll("\\", "/");
  for (const source of [...SOURCES, ...EXTRAS]) {
    const racine = source.depuis.replaceAll("\\", "/");
    if (cible === racine) {
      return source.alias;
    }
    if (cible.startsWith(`${racine}/`)) {
      const suffixe = cible.slice(racine.length + 1).replace(/\.tsx?$/, "");
      return `${source.alias}/${suffixe}`;
    }
  }
  return null;
}

let reecrits = 0;
let intacts = 0;
const echecs = [];

for (const source of SOURCES) {
  if (!existsSync(source.hote)) {
    throw new Error(
      `Copie absente : ${relative(RACINE, source.hote)} (lancer la copie avant ce script).`
    );
  }
  for (const fichier of fichiersSous(source.hote)) {
    // Position d'origine : c'est elle qui donne le sens des chemins relatifs.
    const positionSource = resolve(
      source.depuis,
      relative(source.hote, fichier)
    );
    const avant = readFileSync(fichier, "utf8");
    const echecsLocaux = [];

    const apres = avant.replace(
      /(\bfrom\s+|\bimport\s+|\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"]*)\2/g,
      (correspondance, prefixe, citation, specifier) => {
        const cible = versAlias(
          resolve(dirname(positionSource), specifier.replace(/\.js$/, ""))
        );
        if (!cible) {
          echecsLocaux.push(specifier);
          return correspondance;
        }
        return `${prefixe}${citation}${cible}${citation}`;
      }
    );

    for (const specifier of echecsLocaux) {
      echecs.push(`${relative(RACINE, fichier)} → ${specifier}`);
    }
    if (apres === avant) {
      intacts += 1;
      continue;
    }
    writeFileSync(fichier, apres);
    reecrits += 1;
  }
}

if (echecs.length) {
  console.error(`Imports hors périmètre (${echecs.length}) :`);
  for (const echec of echecs) {
    console.error(`  ${echec}`);
  }
  process.exit(1);
}

console.log(`${reecrits} fichier(s) réécrit(s), ${intacts} déjà conforme(s).`);
