#!/usr/bin/env node
/**
 * Révèle l'empreinte (hôte + base + utilisateur, JAMAIS le mot de passe ni
 * l'URL complète) de la base ciblée par un fichier env, pour comparaison
 * visuelle dans les logs CI.
 *
 * Usage : node scripts/print-db-target.mjs [fichier-env...]
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const envFiles =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : [".env.local", ".env"];

let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
if (!databaseUrl) {
  for (const file of envFiles) {
    if (!existsSync(file)) continue;
    const content = readFileSync(file, "utf8");
    const match = content.match(
      /(?:DATABASE_URL|POSTGRES_URL)\s*=\s*"?([^"\n]+)"?/
    );
    if (match) {
      databaseUrl = match[1].trim();
      break;
    }
  }
}

if (!databaseUrl) {
  console.error(
    "::error::DATABASE_URL/POSTGRES_URL introuvable (environnement ni fichiers env)."
  );
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(databaseUrl);
} catch {
  console.error("::error::DATABASE_URL non parsable comme URL.");
  process.exit(1);
}

// Empreinte courte et stable de l'URL complète (sans mot de passe affiché) :
// permet de comparer deux cibles sans exposer d'identifiant.
const fingerprint = createHash("sha256")
  .update(`${parsed.username}@${parsed.host}${parsed.pathname}`)
  .digest("hex")
  .slice(0, 12);

console.log(
  `Base cible : ${parsed.hostname}/${parsed.pathname.replace("/", "")} (utilisateur ${parsed.username || "n/a"}, empreinte ${fingerprint})`
);
