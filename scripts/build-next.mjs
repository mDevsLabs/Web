#!/usr/bin/env node
/**
 * Lance `next build` en rejouant la compilation quand Google Fonts renvoie
 * une réponse que Turbopack ne sait pas lire.
 *
 * POURQUOI CE SCRIPT
 *
 * `next/font/google` télécharge la feuille de style Google au moment du build.
 * Google répond parfois (environ une fois sur soixante) avec des URL de
 * fichiers SANS extension :
 *
 *   https://fonts.gstatic.com/l/font?kit=…&skey=…&v=v20
 *
 * Turbopack sérialise cette URL dans la requête d'import interne du fichier de
 * police. Le `&` de `&skey=…` y découpe alors une seconde entrée, et le build
 * échoue en :
 *
 *   Error while looking up import map:
 *     next/font/google queries have exactly one entry
 *
 * C'est un défaut amont (vercel/next.js#99114) : la réponse est un 200, donc
 * le `retry` interne de Next.js ne se déclenche jamais. Le correctif est livré
 * dans Next 16.4.3 ; tant que le dépôt épingle une version antérieure, la
 * seule défense côté dépôt est de rejouer la compilation — l'échec est
 * intermittent, et un second passage récupère une réponse à la bonne forme.
 *
 * Le script devient un simple relais dès que Next 16.4.3 (ou plus récent) est
 * installé : c'est la sortie définitive, et elle ne demande aucune retouche
 * ici.
 *
 * Usage : node scripts/build-next.mjs [args transmis à `next build`]
 */

import { spawn } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

/**
 * Signature du défaut amont. On ne rejoue QUE sur celle-ci : rejouer sur une
 * erreur quelconque masquerait une régression de code derrière deux
 * compilations supplémentaires, sans rien corriger.
 *
 * Les espaces sont tolérants (`\s+`) : selon le terminal, le message peut être
 * replié sur plusieurs lignes.
 */
const SIGNATURE_POLICE_GOOGLE =
  /next\/font\/google\s+queries\s+have\s+exactly\s+one\s+entry/;

/**
 * Nombre total de tentatives (la première comprise). À 1/60 par famille et par
 * build, trois passages ramènent la probabilité d'un échec résiduel sous le
 * millionième.
 */
const TENTATIVES = 3;

/**
 * Pause avant de rejouer : Google répartit la réponse défectueuse par nœud,
 * une relance immédiate peut retomber sur le même.
 */
const DELAI_ENTRE_TENTATIVES_MS = 3000;

/**
 * On conserve la fin du journal : l'erreur de police est la DERNIÈRE chose que
 * Turbopack écrit, mais les premières lignes servent à diagnostiquer les
 * autres échecs. 256 Ko couvrent largement les deux.
 */
const TAILLE_JOURNAL_CONSERVE = 256 * 1024;

const require = createRequire(import.meta.url);
const racine = resolve(import.meta.dirname, "..");

/** Lit la version de Next réellement installée, ou `null`. */
function versionNext() {
  try {
    const manifeste = join(racine, "node_modules", "next", "package.json");
    const paquet = JSON.parse(readFileSync(manifeste, "utf8"));
    return typeof paquet.version === "string" ? paquet.version : null;
  } catch {
    return null;
  }
}

/**
 * Vrai quand la version installée PORTE le correctif amont, donc quand la
 * reprise n'a plus de raison d'être.
 *
 * Une version illisible n'est pas considérée comme corrigée : le doute doit
 * laisser la reprise active (l'utilisateur n'y perd qu'un éventuel second
 * passage), jamais la retirer.
 */
function versionCorrigee(version) {
  if (!version) {
    return false;
  }
  const nombres = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!nombres) {
    return false;
  }
  const majeur = Number(nombres[1]);
  const mineur = Number(nombres[2]);
  const correctif = Number(nombres[3]);
  if (majeur !== 16) {
    return majeur > 16;
  }
  if (mineur !== 4) {
    return mineur > 4;
  }
  return correctif >= 3;
}

/** Exécute `next build`, relaie sa sortie, et rend son code et son journal. */
function executerBuild(args) {
  const binNext = require.resolve("next/dist/bin/next");
  const enfant = spawn(process.execPath, [binNext, "build", ...args], {
    cwd: racine,
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
  });

  // La sortie est RELAYÉE telle quelle (Vercel n'affiche que ce que le
  // processus imprime) et CONSERVÉE en parallèle, rognée par le début.
  const morceaux = [];
  let taille = 0;
  const conserver = (bloc) => {
    morceaux.push(bloc);
    taille += bloc.length;
    while (taille > TAILLE_JOURNAL_CONSERVE && morceaux.length > 1) {
      taille -= morceaux[0].length;
      morceaux.shift();
    }
  };
  enfant.stdout.on("data", (bloc) => {
    process.stdout.write(bloc);
    conserver(bloc);
  });
  enfant.stderr.on("data", (bloc) => {
    process.stderr.write(bloc);
    conserver(bloc);
  });

  // Ctrl-C doit atteindre le build, pas seulement le relais.
  const relayer = (signal) => {
    if (!enfant.killed) {
      enfant.kill(signal);
    }
  };
  process.on("SIGINT", () => relayer("SIGINT"));
  process.on("SIGTERM", () => relayer("SIGTERM"));

  return new Promise((resolveBuild) => {
    enfant.on("error", (erreur) => {
      console.error(`[build-next] Lancement impossible : ${erreur.message}`);
      resolveBuild({ code: 1, journal: "" });
    });
    enfant.on("exit", (code, signal) => {
      resolveBuild({
        code: signal ? 1 : (code ?? 1),
        journal: Buffer.concat(morceaux).toString("utf8"),
      });
    });
  });
}

const attendre = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const version = versionNext();
const repriseActive = !versionCorrigee(version);
const tentatives = repriseActive ? TENTATIVES : 1;
const args = process.argv.slice(2);

if (repriseActive) {
  console.log(
    `[build-next] Next ${version ?? "inconnu"} : reprise automatique si Google Fonts renvoie une URL sans extension (vercel/next.js#99114).`
  );
}

let codeFinal = 1;
for (let tentative = 1; tentative <= tentatives; tentative += 1) {
  if (tentative > 1) {
    console.warn(
      `[build-next] Nouvelle tentative ${tentative}/${tentatives} : la feuille de style Google Fonts précédente avait la mauvaise forme.`
    );
    // Le cache Turbopack rejouerait la MÊME réponse défectueuse : on le jette
    // pour forcer un nouveau téléchargement. Le reste de `.next` est écrasé
    // par le build lui-même.
    rmSync(join(racine, ".next", "cache"), { force: true, recursive: true });
    await attendre(DELAI_ENTRE_TENTATIVES_MS);
  }

  const { code, journal } = await executerBuild(args);
  codeFinal = code;

  if (code === 0 || !SIGNATURE_POLICE_GOOGLE.test(journal)) {
    break;
  }

  if (tentative === tentatives) {
    if (repriseActive) {
      console.error(
        `[build-next] Le défaut Google Fonts persiste après ${tentatives} tentatives. Ce n'est plus le hasard du CDN : installez Next >= 16.4.3 (« pnpm add next@^16.4.3 ») pour recevoir le correctif amont.`
      );
    }
    break;
  }
}

process.exitCode = codeFinal;
