import { unzipSync, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
  construireArbre,
  ErreurExport,
  espaceEnJSON,
  espaceEnMarkdown,
  fichiersExport,
  LIMITES_EXPORT,
  nomDeFichierPage,
  type PageExport,
  slugDeTitre,
} from "@/lib/wakies/shared/space-export";

/**
 * Export d'un Espace : arbre, ordre, noms de fichiers et bornes.
 *
 * Ces règles vivaient dans le module pur précisément pour être vérifiables ici.
 * Un export est la seule copie que l'utilisateur emporte : une sous-page perdue,
 * deux pages homonymes qui s'écrasent ou une archive tronquée sans message sont
 * des pertes de données que rien à l'écran ne signale.
 */

const JOUR = 86_400_000;

function page(
  id: string,
  titre: string,
  options: {
    content?: string;
    createdAt?: number;
    parentId?: string | null;
    updatedAt?: number;
  } = {}
): PageExport {
  const createdAt = options.createdAt ?? JOUR;
  return {
    content: options.content ?? `corps de ${titre}`,
    createdAt,
    id,
    parentId: options.parentId ?? null,
    revision: 1,
    title: titre,
    updatedAt: options.updatedAt ?? createdAt + 1,
  };
}

const ESPACE = {
  createdAt: JOUR,
  description: "Brouillons de veille",
  name: "Recherche / IA",
};

describe("construireArbre", () => {
  it("impose l'ordre de création puis l'identifiant, pas celui de la requête", () => {
    const racines = construireArbre([
      page("p-b", "Deuxième", { createdAt: 2 * JOUR }),
      page("p-a", "Première", { createdAt: 1 * JOUR }),
      page("p-c", "Tardive", { createdAt: 3 * JOUR }),
    ]);
    expect(racines.map((noeud) => noeud.page.title)).toEqual([
      "Première",
      "Deuxième",
      "Tardive",
    ]);
  });

  it("range les pages de même date par identifiant, pour que deux exports soient identiques", () => {
    const memeJour = 5 * JOUR;
    const racines = construireArbre([
      page("z-2", "Zoulou", { createdAt: memeJour }),
      page("a-1", "Alpha", { createdAt: memeJour }),
    ]);
    expect(racines.map((noeud) => noeud.page.id)).toEqual(["a-1", "z-2"]);
  });

  it("imbre les sous-pages, y compris trois niveaux", () => {
    const racines = construireArbre([
      page("p-1", "Parent"),
      page("p-2", "Enfant", { parentId: "p-1" }),
      page("p-3", "Petit-enfant", { parentId: "p-2" }),
    ]);
    expect(racines).toHaveLength(1);
    expect(racines[0]?.children[0]?.children[0]?.page.title).toBe(
      "Petit-enfant"
    );
  });

  it("garde une sous-page orpheline comme racine : elle n'est jamais perdue", () => {
    const racines = construireArbre([
      page("p-1", "Visible"),
      page("p-2", "Orpheline", { parentId: "p-absent" }),
    ]);
    expect(racines.map((noeud) => noeud.page.title)).toEqual([
      "Visible",
      "Orpheline",
    ]);
  });

  it("survit à une boucle de parenté au lieu de boucler", () => {
    // Deux pages qui se déclarent mutuellement parentes ne doivent pas faire
    // tourner `construireArbre` à l'infini : la seconde redevient une racine.
    const racines = construireArbre([
      page("p-1", "Un", { parentId: "p-2" }),
      page("p-2", "Deux", { parentId: "p-1" }),
    ]);
    expect(racines).toHaveLength(2);
  });
});

describe("espaceEnMarkdown", () => {
  it("porte le nom, la description et l'arborescence en titres", () => {
    const texte = espaceEnMarkdown(
      ESPACE,
      construireArbre([
        page("p-1", "Réunion"),
        page("p-2", "Comptes rendus", { parentId: "p-1" }),
      ])
    );
    expect(texte).toContain("# Recherche / IA");
    expect(texte).toContain("Brouillons de veille");
    expect(texte).toContain("## Réunion");
    expect(texte).toContain("### Comptes rendus");
    expect(texte).toContain("corps de Réunion");
  });

  it("dit vide plutôt que de laisser croire à une page sans contenu perdu", () => {
    const texte = espaceEnMarkdown(
      ESPACE,
      construireArbre([page("p-1", "Page en blanc", { content: "   " })])
    );
    expect(texte).toContain("_(vide)_");
  });

  it("refuse un Espace au-dessus de la borne de pages, sans produire un export partiel", () => {
    const pages = Array.from({ length: LIMITES_EXPORT.pagesMax + 1 }, (_, i) =>
      page(`p-${i}`, `Page ${i}`)
    );
    expect(() => espaceEnMarkdown(ESPACE, construireArbre(pages))).toThrow(
      ErreurExport
    );
  });

  it("refuse un volume au-dessus de la borne, compté sur le résultat", () => {
    const geant = page("p-1", "Geant", {
      content: "a".repeat(LIMITES_EXPORT.caracteresMax + 10),
    });
    expect(() => espaceEnMarkdown(ESPACE, construireArbre([geant]))).toThrow(
      ErreurExport
    );
  });
});

describe("espaceEnJSON", () => {
  it("rejoue l'arbre avec les identifiants et les horodatages ISO", () => {
    const analyse = JSON.parse(
      espaceEnJSON(
        ESPACE,
        construireArbre([
          page("p-1", "Une"),
          page("p-2", "Deux", { parentId: "p-1" }),
        ])
      )
    ) as { pages: Array<{ children: unknown[]; id: string }> };
    expect(analyse.pages[0]?.id).toBe("p-1");
    expect(analyse.pages[0]?.children).toHaveLength(1);
  });
});

describe("nomDeFichierPage", () => {
  it("numerote pour que deux pages homonymes ne s'écrasent pas", () => {
    expect(nomDeFichierPage("Réunion", 0)).toBe("01-reunion.md");
    expect(nomDeFichierPage("Réunion", 1)).toBe("02-reunion.md");
  });

  it("ne laisse aucun caractère interdit au chemin", () => {
    expect(nomDeFichierPage('a/b\\c:d*e?"f<g>|h', 2)).toBe(
      "03-a-b-c-d-e-f-g-h.md"
    );
  });

  it("tombe sur « page » quand le titre ne laisse rien d'écrivable", () => {
    expect(nomDeFichierPage("???", 3)).toBe("04-page.md");
  });
});

describe("slugDeTitre", () => {
  it("garde les accents lisibles au lieu d'en faire des tirets", () => {
    // NFKD décompose « é » en « e » + marque combinante : sans retrait des
    // marques, « Réunion » s'appelait « re-union ».
    expect(slugDeTitre("Réunion hebdomadaire")).toBe("reunion-hebdomadaire");
    expect(slugDeTitre("Noël à Paris — notes")).toBe("noel-a-paris-notes");
  });

  it("borne la longueur du nom de fichier", () => {
    expect(slugDeTitre("a".repeat(200), 48)).toHaveLength(48);
  });
});

describe("fichiersExport", () => {
  const fichiers = fichiersExport(
    ESPACE,
    construireArbre([
      page("p-1", "Alpha"),
      page("p-2", "Beta", { parentId: "p-1" }),
    ])
  );

  it("contient un README et une entrée par page", () => {
    expect(Object.keys(fichiers)).toContain("README.md");
    expect(
      Object.keys(fichiers).filter((nom) => nom.endsWith(".md"))
    ).toHaveLength(3);
  });

  it("range les sous-pages dans un dossier, sinon le ZIP perd la hiérarchie", () => {
    expect(Object.keys(fichiers)).toContain("01-alpha.md");
    expect(Object.keys(fichiers)).toContain("01-alpha/02-beta.md");
  });

  it("survit à un aller-retour ZIP, avec tous ses octets", () => {
    const encodes: Record<string, Uint8Array> = {};
    for (const [chemin, contenu] of Object.entries(fichiers)) {
      encodes[chemin] = new TextEncoder().encode(contenu);
    }
    const deplie = unzipSync(zipSync(encodes));
    expect(Object.keys(deplie).sort()).toEqual(Object.keys(fichiers).sort());
    expect(new TextDecoder().decode(deplie["01-alpha/02-beta.md"])).toContain(
      "corps de Beta"
    );
  });
});
