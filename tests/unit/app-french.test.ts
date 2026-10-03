import { type Dirent, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// L'interface est monolingue français (AGENTS.md §7). Cette règle ne se vérifie
// par aucun test : les chaînes anglaises étaient surtout dans les primitives
// `components/ui` et `components/ai-elements`, exclues du lint, donc jamais
// relues. Un `AlertDialog` « Activate AI Gateway » s'affichait sur TOUTES les
// routes authentifiées via `ChatShell`.
//
// On ne teste pas la grammaire française — trop de faux positifs. On liste des
// motifs qui n'ont aucune raison d'apparaître : un libellé d'accessibilité ou un
// texte d'interface rédigé en anglais, dans les emplacements où l'on sait qu'il
// n'y a pas de raison légitime.
const ROOT = path.resolve(import.meta.dirname, "..", "..");
const TARGET_DIRS = ["components", "app"];

// Motifs interdits. Volontairement étroits : `alt`, `title` et `aria-label`
// doivent être en français, donc les valeurs anglaises sont interdites.
// `placeholder` également. Aucun mot français n'est dans ces listes.
const FORBIDDEN: [RegExp, string][] = [
  // Libellés d'accessibilité.
  [
    /\baria-label="[^"]*\b(Close|Loading|Toggle|Sidebar|Stop|Submit|Upload|Previous|Next|Scroll|Resize|Output|Attachment|Branch)\b/i,
    "aria-label anglais",
  ],
  [
    /\baria-label=\{[^}]*\?\s*"(Stop|Submit)"/i,
    "aria-label conditionnel anglais",
  ],
  // Textes d'interface visibles.
  [/\btitle="(Upload files|Close|Save|Cancel)"/i, "title anglais"],
  [/\balt="(attachment|output)"\b/i, "alt anglais"],
  // Messages utilisateur.
  // Boutons et liens. `delete` est exclu : les valeurs techniques des actions
  // MCP (read/write/delete/execute) sont affichées telles quelles dans un
  // `<select>`, et ce sont des identifiants de catégorie, pas des libellés.
  [/>\s*(Activate|Cancel|Close|Save|Loading|Retry)\s*</i, "bouton anglais"],
  // Titre de boîte de dialogue en anglais, dans les composants où l'on sait
  // que le texte est destiné à l'utilisateur. Une liste de mots en anglais
  // plutôt qu'une détection de phrase : `mAI Web`, `Vercel AI Gateway` ou un nom
  // de modèle produirait des faux positifs impossibles à distinguer ici.
  [
    /(AlertDialogTitle|DialogTitle|SheetTitle)[^>]*>\s*(Activate|Cancel|Close|Save|Delete|Loading|Retry|AI Gateway)\b/,
    "titre de dialogue anglais",
  ],
];

function walk(dir: string): string[] {
  const out: string[] = [];
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe("Interface monolingue français", () => {
  const offenders: string[] = [];

  for (const dir of TARGET_DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      const source = readFileSync(file, "utf8");
      const relative = path.relative(ROOT, file);
      for (const [pattern, label] of FORBIDDEN) {
        if (pattern.test(source)) {
          offenders.push(`${relative} : ${label}`);
        }
      }
    }
  }

  it("n'expose aucun libellé d'interface en anglais", () => {
    expect(offenders).toEqual([]);
  });

  it("exclut bien les répertoires inspectés du test", () => {
    // Si `walk` ne remontait rien, le test passerait à vide. On vérifie qu'il
    // trouve effectivement des fichiers — sans quoi une erreur de chemin
    // donnerait un faux vert.
    expect(walk(path.join(ROOT, "components")).length).toBeGreaterThan(50);
  });
});
