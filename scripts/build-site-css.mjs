#!/usr/bin/env node
/**
 * ============================================================================
 * CONSTRUCTION DE LA FEUILLE DE STYLE SITE POUR L'HÔTE mAI
 * ============================================================================
 *
 * Scoping strict de apps/site/app/globals.css sous `.site-root` :
 *   1. Retire `@import "tailwindcss"` et `@plugin` (l'hôte fournit Tailwind v4).
 *   2. Extrait `@theme` et `@utility` vers des classes et variables CSS sous `.site-root`.
 *   3. Re-ancre tous les sélecteurs de règles sous `.site-root` (:root, html, body -> .site-root).
 *   4. Sortie dans `components/site/site.css`.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import postcss from "postcss";

const RACINE = resolve(import.meta.dirname, "..");
const SOURCE = resolve(RACINE, "apps/site/app/globals.css");
const SORTIE = resolve(RACINE, "components/site/site.css");
const PORTEUR = ".site-root";

if (!existsSync(SOURCE)) {
  console.error(`❌ Source introuvable : ${SOURCE}`);
  process.exit(1);
}

function normaliser(selecteur) {
  let sortie = "";
  let espace = false;
  let chaine = null;
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

  return sortie.trim();
}

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

function dejaAncre(selecteur) {
  return /^\.site-root(?![\w-])/.test(selecteur);
}

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

function ancrerTete(tete) {
  if (tete === "html" || tete === "body" || tete === ":root") return PORTEUR;
  if (tete.startsWith("html")) return `${PORTEUR}${tete.slice(4)}`;
  if (tete.startsWith("[data-theme")) return `${PORTEUR}${tete}`;
  if (dejaAncre(tete)) return tete;
  return `${PORTEUR} ${tete}`;
}

function ancrer(selecteur) {
  const s = normaliser(selecteur);
  if (dejaAncre(s)) return s;

  const [tete, reste] = decouperTete(s);
  const ancree = ancrerTete(tete);

  return !reste || reste === "body" ? ancree : `${ancree} ${reste}`;
}

const pluginSite = () => {
  return {
    Once(root) {
      const extraRules = [];

      root.walk((node) => {
        // Supprimer les imports Tailwind et Typography
        if (
          node.type === "atrule" &&
          (node.name === "import" || node.name === "plugin")
        ) {
          node.remove();
          return;
        }

        // Remplacer @apply par les propriétés CSS équivalentes
        if (node.type === "atrule" && node.name === "apply") {
          if (node.params.includes("rounded-3xl")) {
            node.parent.append(
              postcss.decl({ prop: "border-radius", value: "1.5rem" })
            );
          }
          if (node.params.includes("p-3")) {
            node.parent.append(
              postcss.decl({ prop: "padding", value: "0.75rem" })
            );
          }
          node.remove();
          return;
        }

        // Convertir @utility <name> { ... } en .site-root .<name> { ... }
        if (node.type === "atrule" && node.name === "utility") {
          const utilName = node.params.trim();
          const rule = postcss.rule({
            selector: `${PORTEUR} .${utilName}`,
          });
          node.each((child) => {
            rule.append(child.clone());
          });
          extraRules.push(rule);
          node.remove();
          return;
        }

        // Convertir @theme { ... }
        if (node.type === "atrule" && node.name === "theme") {
          const rootVarsRule = postcss.rule({
            selector: PORTEUR,
          });
          const keyframesRules = [];

          node.each((child) => {
            if (child.type === "decl") {
              rootVarsRule.append(child.clone());
            } else if (child.type === "atrule" && child.name === "keyframes") {
              keyframesRules.push(child.clone());
            }
          });

          extraRules.push(rootVarsRule);
          for (const kf of keyframesRules) {
            extraRules.push(kf);
          }
          node.remove();
          return;
        }

        // Déballer @layer base / @layer utilities
        if (node.type === "atrule" && node.name === "layer") {
          node.each((child) => {
            if (child.type === "rule") {
              child.walkAtRules("apply", (applyNode) => {
                if (applyNode.params.includes("rounded-3xl")) {
                  applyNode.parent.append(
                    postcss.decl({ prop: "border-radius", value: "1.5rem" })
                  );
                }
                if (applyNode.params.includes("p-3")) {
                  applyNode.parent.append(
                    postcss.decl({ prop: "padding", value: "0.75rem" })
                  );
                }
                applyNode.remove();
              });
              const nouveaux = decouperSelecteurs(child.selector).map(ancrer);
              child.selector = nouveaux.join(", ");
              extraRules.push(child.clone());
            }
          });
          node.remove();
          return;
        }

        // Ré-ancrer les règles régulières
        if (node.type === "rule") {
          // Remplacer @apply à l'intérieur de la règle
          node.walkAtRules("apply", (applyNode) => {
            if (applyNode.params.includes("rounded-3xl")) {
              applyNode.parent.append(
                postcss.decl({ prop: "border-radius", value: "1.5rem" })
              );
            }
            if (applyNode.params.includes("p-3")) {
              applyNode.parent.append(
                postcss.decl({ prop: "padding", value: "0.75rem" })
              );
            }
            applyNode.remove();
          });

          // Ignorer les règles à l'intérieur des keyframes
          if (
            node.parent?.type === "atrule" &&
            node.parent.name === "keyframes"
          ) {
            return;
          }

          const nouveaux = decouperSelecteurs(node.selector).map(ancrer);
          node.selector = nouveaux.join(", ");
        }
      });

      for (const r of extraRules) {
        root.append(r);
      }
    },
    postcssPlugin: "postcss-site-scope",
  };
};
pluginSite.postcss = true;

async function compiler() {
  const css = readFileSync(SOURCE, "utf8");
  const resultat = await postcss([pluginSite()]).process(css, {
    from: SOURCE,
    to: SORTIE,
  });

  const dossierSortie = dirname(SORTIE);
  if (!existsSync(dossierSortie)) {
    mkdirSync(dossierSortie, { recursive: true });
  }

  // En-tête explicite
  const entete =
    "/**\n * FEUILLE DE STYLE SITE PORTÉE — GÉNÉRÉE AUTOMATIQUEMENT\n * Source : apps/site/app/globals.css\n * Script : scripts/build-site-css.mjs\n * NE PAS ÉDITER À LA MAIN — relancer le script après toute modification.\n */\n\n";

  writeFileSync(SORTIE, entete + resultat.css, "utf8");
  console.log(`✅ Feuille de style Site générée avec succès : ${SORTIE}`);
}

compiler().catch((err) => {
  console.error("❌ Échec de la génération de site.css :", err);
  process.exit(1);
});
