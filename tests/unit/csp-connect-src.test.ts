import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * La directive `connect-src` couvre-t-elle les origines que le navigateur appelle
 * réellement ?
 *
 * Régression : `components/site/status-widget.tsx` appelait
 * `https://mai.instatus.com/summary.json` et trois widgets appelaient
 * `https://api.github.com/...`. Aucune de ces origines n'est dans `connect-src`
 * (`next.config.ts`), et la politique s'applique à tout le site via
 * `headers()` sur `source: "/(.*)"`. Les requêtes échouaient donc **à chaque
 * montage** — et comme chaque composant convertissait son échec en valeur par
 * défaut, la pastille de statut affichait « Opérationnel » en permanence.
 *
 * Le vrai manque n'était pas la liste des origines mais l'absence de garde : la
 * CSP est tenue à la main, chaque fetch externe ajouté au code peut la traverser
 * sans qu'aucun contrôle ne le dise. Ce test ferme ce processus : il lit la
 * politique et le code, et il échoue sur l'écart.
 *
 * Un fetch serveur n'est pas régi par la CSP. Seuls les modules `"use client"`
 * sont donc contrôlés — c'est ce qui évite que les ~150 routes BFF du dépôt ne
 * hurlent pour rien.
 */

const ROOT = resolve(import.meta.dirname, "..", "..");
const DOSSIERS_CLIENT = ["app", "components", "hooks", "lib"] as const;

/** Origines déclarées par la politique de PRODUCTION (branche `isDev` exclue). */
function originesAutorisees(): Set<string> {
  const config = readFileSync(resolve(ROOT, "next.config.ts"), "utf8");
  const debut = config.indexOf('"connect-src"');
  expect(
    debut,
    "directive connect-src introuvable dans next.config.ts"
  ).toBeGreaterThan(-1);

  const corps =
    config
      .slice(debut)
      .slice(config.slice(debut).indexOf("[") + 1)
      // La branche de développement (`...(isDev ? ["ws:", "wss:", …] : [])`) n'est
      // pas ce que voit un visiteur en production : l'inclure validerait des origines
      // que personne n'a hors du `next dev`.
      .split("...(isDev")[0] ?? "";
  const borne = corps.indexOf("]");
  const texte = borne >= 0 ? corps.slice(0, borne) : corps;

  const origines = new Set<string>();
  for (const correspondance of texte.matchAll(/"(https?:\/\/[^"]+)"/g)) {
    const valeur = correspondance[1];
    if (valeur) {
      origines.add(valeur.replace(/\/+$/, ""));
    }
  }
  // `apiOrigin` est une variable, pas un littéral : la politique la construit
  // depuis NEXT_PUBLIC_MAI_API_URL avec le même défaut que `lib/constants.ts`.
  // Reproduire l'expression vaut mieux que codenter l'attendu en dur.
  const apiOrigin =
    process.env.NEXT_PUBLIC_MAI_API_URL || "https://mai.val.run";
  try {
    origines.add(new URL(apiOrigin).origin);
  } catch {
    origines.add("https://mai.val.run");
  }
  return origines;
}

type AppelExterne = { fichier: string; ligne: number; origine: string };

type FichierClient = { chemin: string; lignes: string[] };

/**
 * Une seule marche, une seule lecture.
 *
 * Le budget de ce fichier est I/O, pas logique : sous la suite complète (125
 * workers isolés sur le même disque), deux parcours séparés de `app/`,
 * `components/`, `hooks/` et `lib/` dépassaient le timeout Vitest de cinq
 * secondes. Le partage du parcours divise ce coût par deux, et le timeout
 * explicite ci-dessous documente la contrainte plutôt que de la masquer.
 */
const MODULES_CLIENT: FichierClient[] = DOSSIERS_CLIENT.flatMap((dossier) =>
  marcher(resolve(ROOT, dossier))
)
  .filter((fichier) => /\.tsx?$/.test(fichier))
  .map((fichier) => {
    const source = lire(fichier);
    // Le marqueur d'exécution navigateur est le seul juge fiable : un module
    // `server-only` ou un composant serveur RSC ne passe pas par la CSP.
    return source.includes('"use client"')
      ? {
          chemin: fichier
            .slice(ROOT.length + 1)
            .split(sep)
            .join("/"),
          lignes: source.split(/\r?\n/),
        }
      : null;
  })
  .filter((entree): entree is FichierClient => entree !== null);

function appelsExternes(): AppelExterne[] {
  const trouvés: AppelExterne[] = [];
  for (const moduleClient of MODULES_CLIENT) {
    moduleClient.lignes.forEach((ligne, index) => {
      for (const correspondance of ligne.matchAll(
        /(?:fetch|EventSource|WebSocket)\s*\(\s*["'`](https?:\/\/[^"'`\s]+|wss?:\/\/[^"'`\s]+)/g
      )) {
        const brut = correspondance[1];
        if (!brut) {
          continue;
        }
        trouvés.push({
          fichier: moduleClient.chemin,
          ligne: index + 1,
          origine: origineDe(brut),
        });
      }
    });
  }
  return trouvés;
}

function origineBrut(url: string): string | null {
  try {
    const parse = new URL(url);
    if (parse.protocol === "ws:" || parse.protocol === "wss:") {
      return `${parse.protocol}//${parse.host}`;
    }
    return parse.origin;
  } catch {
    return null;
  }
}

function origineDe(url: string): string {
  return origineBrut(url) ?? url;
}

function marcher(dossier: string): string[] {
  const sortie: string[] = [];
  if (!existsSync(dossier)) {
    return sortie;
  }
  for (const entree of readdirSync(dossier, { withFileTypes: true })) {
    if (entree.name === "node_modules" || entree.name.startsWith(".")) {
      continue;
    }
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) {
      sortie.push(...marcher(chemin));
    } else {
      sortie.push(chemin);
    }
  }
  return sortie;
}

/** Lecture tolérante : la suite complète tourne en parallèle du dépôt. */
function lire(fichier: string): string {
  try {
    return readFileSync(fichier, "utf8");
  } catch {
    return "";
  }
}

describe("CSP — connect-src couvre les appels navigateur", () => {
  const autorisees = originesAutorisees();
  const appels = appelsExternes();

  it("lit une politique non vide", () => {
    expect(autorisees.size).toBeGreaterThan(1);
    expect(autorisees.has("https://mai.val.run")).toBe(true);
  });

  it.each(
    appels.map((appel) => [appel.fichier, appel.ligne, appel.origine] as const)
  )("%s:%i appelle %s", (_fichier, ligne, origine) => {
    expect(
      autorisees.has(origine),
      `${_fichier}:${ligne} appelle ${origine}, que connect-src n'autorise pas. ` +
        "Soit l'appel passe par une route BFF interne (recommandé : le délai, le " +
        "cache et le repli y vivent déjà), soit l'origine est ajoutée à la politique."
    ).toBe(true);
  });

  it("ne laisse aucun widget de statut appeler une origine externe en direct", () => {
    // Le défaut d'origine, sous sa forme la plus coûteuse : un composant qui
    // croit savoir et ne s'interroge jamais.
    const source = readFileSync(
      resolve(ROOT, "components/site/status-widget.tsx"),
      "utf8"
    );
    expect(source).not.toMatch(/fetch\(\s*["'`]https:\/\//);
    expect(source).not.toContain('useState<string>("UP")');
    expect(source).toContain("SITE_API_ROUTES.status");
  });

  it("ne publie aucun jeton dans un module exécuté par le navigateur", () => {
    const incriminés = MODULES_CLIENT.filter((moduleClient) =>
      /NEXT_PUBLIC_[A-Z_]*TOKEN/.test(moduleClient.lignes.join("\n"))
    ).map((moduleClient) => moduleClient.chemin);
    // `NEXT_PUBLIC_*` est inliné dans le bundle : la variable n'est pas un
    // secret, c'est sa publication. Et le dépôt n'a plus de token GitHub global.
    expect(incriminés).toEqual([]);
  }, 30_000); // Budget I/O partagé avec la marche unique ci-dessus, pas une logique lente.
});
