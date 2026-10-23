import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

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
  "assets",
  "web",
]);

const EMOJI = /(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\uFE0F)/gu;

const trouves = [];

function parcourir(chemin) {
  let entrees;
  try {
    entrees = readdirSync(chemin);
  } catch {
    return;
  }
  for (const nom of entrees) {
    const complet = join(chemin, nom);
    if (EXCLUS.has(nom)) {
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
    } else if (
      EXTENSIONS.includes(complet.slice(complet.lastIndexOf("."))) &&
      stats.size <= 2_000_000
    ) {
      const contenu = readFileSync(complet, "utf8");
      EMOJI.lastIndex = 0;
      const trouvees = contenu.match(EMOJI);
      if (trouvees?.length) {
        trouves.push([complet, trouvees.length]);
      }
    }
  }
}

for (const dossier of DOSSIERS) {
  parcourir(dossier);
}
for (const nom of readdirSync(".")) {
  if (!EXTENSIONS.includes(nom.slice(nom.lastIndexOf(".")))) {
    continue;
  }
  try {
    if (!statSync(nom).isFile()) {
      continue;
    }
    const contenu = readFileSync(nom, "utf8");
    EMOJI.lastIndex = 0;
    const trouvees = contenu.match(EMOJI);
    if (trouvees?.length) {
      trouves.push([nom, trouvees.length]);
    }
  } catch {
    // fichier illisible : sans effet
  }
}

let total = 0;
for (const [fichier, n] of trouves.sort((a, b) => b[1] - a[1])) {
  total += n;
  console.log(`${String(n).padStart(5)}  ${fichier}`);
}
console.log(`\n${trouves.length} fichiers, ${total} emojis restants.`);
