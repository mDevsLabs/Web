import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Nettoyage des emojis décoratifs.
 *
 * On retire ce qui est un EMOJI, pas ce qui est un symbole typographique :
 * `★`, `✓`, `✕`, `▸`, `☑`, `☐`, `⌘`, `©`, `→` portent un sens dans
 * l'interface et restent.
 *
 * On laisse aussi les palettes FONCTIONNELLES (réactions Wakies, réactions
 * Vibe, stickers de stories) : elles sont validées côté serveur, et les
 * retirer casserait des contrats. Les cases à cocher de listes de tâches du
 * Coder (☑/☐) restent de même.
 */

const DOSSIERS = [
  "app",
  "components",
  "lib",
  "hooks",
  "scripts",
  "docs",
  "apps",
  "tests",
  ".github",
  "packages",
];

const EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".md",
  ".yml",
  ".yaml",
  ".html",
  ".json",
  ".txt",
  ".sql",
];

/** Répertoires et fichiers dont le contenu emoji est une DONNÉE. */
const EXCLUS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "test-results",
  "artifacts",
  ".freebuff",
  "coverage",
  "public",
  "lib/wakies/shared/reactions.ts",
  "components/vibe/messages/reactionEmojis.ts",
  "apps/vibe/src/components/messages/reactionEmojis.ts",
  "vibe-stories.ts",
  "apps/coder/main-src/bots/platforms/platformMarkdown.ts",
  "apps/coder/main-src/bots/platforms/platformMarkdown.test.ts",
  "lib/db/migrations/meta",
  "packages/icons/catalog",
  "apps/site/docs/documentation",
  "assets",
  "web",
]);

/** Au-delà de ce poids, le fichier est un artefact, pas une source. */
const TAILLE_MAX = 2_000_000;

/**
 * Emoji : caractères à présentation emoji, caractères textuels suivis de
 * l'indicateur de variante, et l'indicateur de variante seul.
 */
const EMOJI = /(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\uFE0F)/gu;

let nettoyes = 0;
let dejaPropres = 0;
let occurrences = 0;

function traiter(fichier) {
  const rel = fichier.replace(/\\/g, "/");
  if (EXCLUS.has(rel)) {
    return;
  }
  const avant = readFileSync(fichier, "utf8");
  EMOJI.lastIndex = 0;
  if (!EMOJI.test(avant)) {
    return;
  }
  EMOJI.lastIndex = 0;
  const trouvees = avant.match(EMOJI)?.length ?? 0;

  let apres = avant.replace(EMOJI, "");
  // L'emoji laisse un espace derrière lui : on le resserre.
  apres = apres.replace(/(?<=\S)[ \t]{2,}/g, " ");
  apres = apres.replace(/[ \t]+$/gm, "");
  apres = apres.replace(/ +([,.;:!?»])/g, "$1");

  if (apres === avant) {
    dejaPropres += 1;
    return;
  }
  writeFileSync(fichier, apres, "utf8");
  nettoyes += 1;
  occurrences += trouvees;
}

function parcourir(chemin) {
  let entrees;
  try {
    entrees = readdirSync(chemin);
  } catch {
    return;
  }
  for (const nom of entrees) {
    const complet = join(chemin, nom);
    const rel = complet.replace(/\\/g, "/");
    if (EXCLUS.has(rel) || EXCLUS.has(nom)) {
      continue;
    }
    let stats;
    try {
      stats = statSync(complet);
    } catch {
      continue;
    }
    if (stats.isDirectory()) {
      parcourir(complet);
    } else if (EXTENSIONS.includes(complet.slice(complet.lastIndexOf(".")))) {
      if (stats.size <= TAILLE_MAX) {
        traiter(complet);
      }
    }
  }
}

for (const dossier of DOSSIERS) {
  parcourir(dossier);
}

// Les fichiers de la RACINE (backend Val Town, scripts d'administration).
for (const nom of readdirSync(".")) {
  if (!EXTENSIONS.includes(nom.slice(nom.lastIndexOf(".")))) {
    continue;
  }
  let stats;
  try {
    stats = statSync(nom);
  } catch {
    continue;
  }
  if (stats.isFile()) {
    traiter(nom);
  }
}

console.log(
  `Fichiers nettoyés : ${nettoyes} (${occurrences} emojis retirés, ${dejaPropres} déjà propres).`
);
