#!/usr/bin/env node
/**
 * ============================================================================
 * BASCULE DES IMPORTS DE ROUTAGE — react-router-dom → adaptateur Vibe
 * ============================================================================
 *
 * Quinze fichiers Vibe importaient `{ Link, useNavigate, useLocation,
 * useParams }` de `react-router-dom`. L'adaptateur `components/vibe/router.tsx`
 * expose les mêmes primitives sur l'App Router : on substitue le module, rien
 * d'autre. Les pages n'ont pas à choisir entre `useRouter` et `usePathname`.
 *
 * Le specifier est calculé depuis le chemin réel du fichier (pas écrit en dur) :
 * `pages/X.tsx` et `layout/X.tsx` n'ont pas la même profondeur.
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";

const RACINE = resolve(import.meta.dirname, "..");
const ADAPTATEUR = resolve(RACINE, "components/vibe/router");

/** Tous les .tsx de l'arborescence Vibe, pour ne rien laisser derrière. */
function tsxSous(dossier, sortie = []) {
  for (const nom of readdirSync(dossier)) {
    const chemin = resolve(dossier, nom);
    if (statSync(chemin).isDirectory()) {
      tsxSous(chemin, sortie);
    } else if (nom.endsWith(".tsx")) {
      sortie.push(chemin);
    }
  }
  return sortie;
}

let reecrits = 0;

for (const fichier of [
  ...tsxSous(resolve(RACINE, "components/vibe")),
  ...tsxSous(resolve(RACINE, "lib/vibe")),
]) {
  const avant = readFileSync(fichier, "utf8");
  if (!avant.includes("react-router-dom")) {
    continue;
  }

  const relatif = relative(dirname(fichier), ADAPTATEUR).replace(/\\/g, "/");
  const specifier = (
    relatif.startsWith(".") ? relatif : `./${relatif}`
  ).replace(/\.tsx$/, "");

  const apres = avant.replace(/(['"])react-router-dom\1/g, `'${specifier}'`);
  writeFileSync(fichier, apres);
  reecrits += 1;
  console.log(
    `  ${relative(RACINE, fichier).replace(/\\/g, "/")} → ${specifier}`
  );
}

if (reecrits === 0) {
  console.log("Aucun import react-router-dom restant.");
} else {
  console.log(`✓ ${reecrits} fichier(s) basculés vers l'adaptateur Vibe`);
}

// Garde-fou : plus aucune référence ne doit subsister.
for (const fichier of [
  ...tsxSous(resolve(RACINE, "components/vibe")),
  ...tsxSous(resolve(RACINE, "lib/vibe")),
]) {
  if (
    existsSync(fichier) &&
    readFileSync(fichier, "utf8").includes("'react-router-dom'")
  ) {
    console.error(`Référence résiduelle : ${relative(RACINE, fichier)}`);
    process.exit(1);
  }
}
