#!/usr/bin/env node
/**
 * ============================================================================
 * RÉÉCRITURE DES IMPORTS — Vibe vers l'arborescence hôte
 * ============================================================================
 *
 * Les fichiers Vibe ont été déplacés de `apps/vibe/src/` vers deux emplacements
 * du dépôt hôte :
 *
 *   src/components/**  →  components/vibe/**    (structure conservée)
 *   src/{context,hooks,services,types,data,algorithms}  →  lib/vibe/**
 *
 * Tous les imports étaient relatifs (`../../services/api`). On choisit de
 * RÉSOUDRE chaque specifier depuis sa position d'origine, puis de le réémettre
 * en alias `@/…`, plutôt que de corriger chaque `../` un par un.
 *
 * Pourquoi : 98 fichiers, chacun à une profondeur différente, et une faute de
 * compte dans un `../` ne se remarque qu'à l'exécution. Ici le chemin est résolu
 * par le système de fichiers puis comparé à une table de correspondance
 * explicite : un import qui sort du périmètre est une ERREUR, jamais un import
 * silencieusement cassé.
 *
 * RELIÈVE : les specifiers `./X.tsx` (avec extension) sont normalisés — Vite les
 * acceptait, TypeScript en résolution « bundler » les refuse.
 *
 * Ce script est ponctuel : il sert au port. Une fois les imports convertis, il
 * n'a plus rien à faire et le dépôt n'en dépend plus.
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

/**
 * Table de correspondance : racine source → préfixe d'alias `@/`.
 * Un fichier hors de ces racines est rejeté par `versAlias`.
 */
const ALIAS = [
  {
    alias: "@/components/vibe",
    from: resolve(RACINE, "apps/vibe/src/components"),
  },
  { alias: "@/lib/vibe", from: resolve(RACINE, "apps/vibe/src") },
];

/**
 * Racine dont on reconstitue la position d'origine pour chaque fichier.
 *
 * `pages/` est le cas particulier : dans l'app Vite il était un frère de
 * `components/` (d'où ses imports `../components/…`), mais dans l'hôte il vit
 * DANS `components/vibe`. La position d'origine est donc `apps/vibe/src/pages`,
 * pas `apps/vibe/src/components/pages` — sans quoi chaque `../components/…`
 * des pages résoudrait un chemin inexistant.
 */
const SOURCES = [
  {
    depuis: resolve(RACINE, "apps/vibe/src/pages"),
    hote: resolve(RACINE, "components/vibe/pages"),
  },
  {
    depuis: resolve(RACINE, "apps/vibe/src/components"),
    hote: resolve(RACINE, "components/vibe"),
  },
  {
    depuis: resolve(RACINE, "apps/vibe/src"),
    hote: resolve(RACINE, "lib/vibe"),
  },
];

/** Résout un specifier relatif vers un fichier existant (extension comprise). */
function resoudre(specifier, fichierAbsolu) {
  const base = resolve(dirname(fichierAbsolu), specifier);
  for (const candidat of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.css`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ]) {
    if (existsSync(candidat)) {
      return candidat;
    }
  }
  return null;
}

/**
 * Traduit un chemin absolu source en alias `@/…`, ou null s'il est hors périmètre.
 *
 * Les séparateurs sont normalisés AVANT toute comparaison : sous Windows,
 * `path.resolve` produit des antislashs, et une comparaison contre `from + '/'`
 * échouerait toujours — aucun alias ne serait jamais produit.
 */
function versAlias(cheminAbsolu) {
  const cible = cheminAbsolu.replace(/\\/g, "/");
  for (const { from, alias } of ALIAS) {
    const racine = from.replace(/\\/g, "/");
    if (cible.startsWith(`${racine}/`)) {
      const reste = cible.slice(racine.length + 1).replace(/\.(tsx?|css)$/, "");
      return `${alias}/${reste}`;
    }
  }
  return null;
}

/** Liste récursive des fichiers source à traiter. */
function fichiersSous(dossier, sortie = []) {
  for (const nom of readdirSync(dossier)) {
    const chemin = resolve(dossier, nom);
    if (statSync(chemin).isDirectory()) {
      fichiersSous(chemin, sortie);
    } else if (/\.(tsx?|css)$/.test(nom)) {
      sortie.push(chemin);
    }
  }
  return sortie;
}

let reecrits = 0;
let intacts = 0;
const echecs = [];

for (const { hote, depuis } of SOURCES) {
  for (const fichier of fichiersSous(hote)) {
    // Position d'origine : nécessaire pour résoudre les chemins relatifs.
    const positionSource = resolve(depuis, relative(hote, fichier));

    const avant = readFileSync(fichier, "utf8");
    const echecsLocaux = [];

    const apres = avant.replace(
      /(\bfrom\s+|\bimport\s+)(['"])(\.\.?\/[^'"]*)\2/g,
      (match, prefixe, quote, specifier) => {
        const sansExt = specifier.replace(/\.(tsx?)$/, "");
        const absolu = resoudre(sansExt, positionSource);
        if (!absolu) {
          echecsLocaux.push(specifier);
          return match;
        }
        const alias = versAlias(absolu);
        if (!alias) {
          echecsLocaux.push(specifier);
          return match;
        }
        // Les feuilles de style conservent leur extension : PostCSS la résout.
        const cible = absolu.endsWith(".css") ? `${alias}.css` : alias;
        return `${prefixe}${quote}${cible}${quote}`;
      }
    );

    // Un fichier dont un seul import échoue n'est pas réécrit du tout : on ne
    // laisse jamais un fichier à moitié converti.
    if (echecsLocaux.length > 0) {
      echecs.push(
        `${relative(RACINE, fichier).replace(/\\/g, "/")} → ${echecsLocaux.join(", ")}`
      );
      continue;
    }

    if (apres === avant) {
      intacts += 1;
    } else {
      writeFileSync(fichier, apres);
      reecrits += 1;
    }
  }
}

if (echecs.length > 0) {
  console.error("Imports non résolus — aucun fichier n'a été réécrit :");
  for (const e of echecs) {
    console.error(`  ${e}`);
  }
  process.exit(1);
}

console.log(
  `✓ imports réécrits : ${reecrits} fichier(s), ${intacts} déjà conformes`
);
