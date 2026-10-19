/**
 * Export d'un Espace Wakies : Markdown agrégé, JSON de sauvegarde, fichiers.
 *
 * Module PUR, sans `server-only` : les règles d'arbre, d'ordre, de noms de
 * fichiers et de bornes sont exactement ce qui doit pouvoir être testé hors
 * base de données. Un export qui tronque silencieusement une page, qui perd une
 * sous-page ou qui écrase deux fichiers du même nom est un export faux — et
 * rien à l'écran ne le dirait.
 *
 * Le contenu d'une page est déjà du Markdown en base (`WakiesPage.content`) :
 * il n'y a rien à convertir depuis Tiptap, seulement à ranger.
 */

/**
 * Ce qu'une page doit fournir pour être exportée.
 *
 * Type structurel volontaire, et non le contrat client `Page` : l'export n'a que
 * faire du pourvoyeur d'une page (`sourceConversationId` côté base, `sourceThreadId`
 * dans le contrat client — les deux noms circulent, aucun n'est exportable).
 * Exiger la forme minimale évite de figer un champ que la base ne nomme pas
 * comme l'interface.
 */
export type PageExport = {
  content: string;
  /** Millisecondes, comme tout horodatage passé par `versClient`. */
  createdAt: number;
  id: string;
  parentId: string | null;
  revision: number;
  title: string;
  updatedAt: number;
};

/** En-tête d'Espace : ce que l'export affiche avant la première page. */
export type EnTeteEspace = {
  createdAt: number;
  description: string;
  name: string;
};

/** Racine `#` prise par le titre de l'Espace : les pages commencent à `##`. */
const PROFONDEUR_TITRE_MAX = 6;

export const LIMITES_EXPORT = {
  /** Garde-fou : au-delà, l'assemblage synchrone coûte trop cher à la requête. */
  caracteresMax: 4_000_000,
  pagesMax: 300,
};

export class ErreurExport extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErreurExport";
  }
}

export type NoeudExport = {
  children: NoeudExport[];
  page: PageExport;
};

/**
 * `parentId` → arbre.
 *
 * Deux règles qui ne sont pas négociables :
 *  - l'ordre est celui de la création puis de l'identifiant, pas celui d'un
 *    `Map` ni de la requête : deux exports du même Espace doivent être
 *    identiques ;
 *  - une page dont le parent est absent redevient une RACINE. Une sous-page
 *    orpheline disparue de l'export serait une page perdue à tort.
 */
export function construireArbre(pages: readonly PageExport[]): NoeudExport[] {
  const noeuds = new Map<string, NoeudExport>();
  for (const page of [...pages].sort(trierPages)) {
    noeuds.set(page.id, { children: [], page });
  }
  const racines: NoeudExport[] = [];
  for (const noeud of noeuds.values()) {
    const parent = noeud.page.parentId
      ? noeuds.get(noeud.page.parentId)
      : undefined;
    // Une page ne devient ENFANT que si ce rattachement ne referme pas une
    // boucle : deux pages qui se déclarent mutuellement parentes ne laissent
    // AUCUNE racine, et un export sans racine est un export vide — la perte la
    // plus silencieuse qui soit. Ramenées en racine, elles restent lisibles.
    if (
      parent &&
      parent !== noeud &&
      !rameneA(noeud.page.id, parent.page, noeuds)
    ) {
      parent.children.push(noeud);
    } else {
      racines.push(noeud);
    }
  }
  // Les enfants suivent le même ordre que les racines.
  const trier = (liste: NoeudExport[]): NoeudExport[] => {
    liste.sort((a, b) => trierPages(a.page, b.page));
    for (const noeud of liste) trier(noeud.children);
    return liste;
  };
  return trier(racines);
}

/** `parent` descend-il, par une chaîne de `parentId`, jusqu'à `id` ? */
function rameneA(
  id: string,
  parent: PageExport,
  noeuds: Map<string, NoeudExport>
): boolean {
  const dejaVus = new Set<string>();
  let curseur: string | null = parent.id;
  while (curseur) {
    if (curseur === id) {
      return true;
    }
    if (dejaVus.has(curseur)) {
      return false;
    }
    dejaVus.add(curseur);
    curseur = noeuds.get(curseur)?.page.parentId ?? null;
  }
  return false;
}

function trierPages(a: PageExport, b: PageExport): number {
  if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Titres en fonction de la profondeur, et un seul niveau au-delà du supporté. */
function titre(niveau: number, texte: string): string {
  const profondeur = Math.min(1 + niveau, PROFONDEUR_TITRE_MAX);
  return `${"#".repeat(profondeur)} ${texte.replace(/\s+/g, " ").trim() || "(sans titre)"}`;
}

function sectionMarkdown(noeud: NoeudExport, niveau: number): string[] {
  const lignes: string[] = [
    titre(niveau, noeud.page.title),
    `*Créée le ${date(noeud.page.createdAt)} · modifiée le ${date(noeud.page.updatedAt)}*`,
    "",
    noeud.page.content.trim() || "_(vide)_",
    "",
  ];
  for (const enfant of noeud.children)
    lignes.push(...sectionMarkdown(enfant, niveau + 1));
  return lignes;
}

function date(millisecondes: number): string {
  const journée = new Date(millisecondes);
  return Number.isNaN(journée.getTime())
    ? "date inconnue"
    : journée.toISOString().slice(0, 10);
}

export function espaceEnMarkdown(
  espace: EnTeteEspace,
  racines: NoeudExport[]
): string {
  verifierBornes(racines);
  const lignes = [
    `# ${espace.name}`,
    espace.description.trim() ? `\n${espace.description.trim()}\n` : "",
    `Exporté le ${date(Date.now())} depuis Wakies.`,
    "",
  ];
  for (const noeud of racines) lignes.push(...sectionMarkdown(noeud, 1));
  const texte = lignes.join("\n").replace(/\n{3,}/g, "\n\n");
  verifierVolume(texte);
  return texte;
}

export function espaceEnJSON(
  espace: EnTeteEspace,
  racines: NoeudExport[]
): string {
  verifierBornes(racines);
  const serialise = (noeud: NoeudExport): Record<string, unknown> => ({
    children: noeud.children.map(serialise),
    content: noeud.page.content,
    createdAt: new Date(noeud.page.createdAt).toISOString(),
    id: noeud.page.id,
    parentId: noeud.page.parentId,
    revision: noeud.page.revision,
    title: noeud.page.title,
    updatedAt: new Date(noeud.page.updatedAt).toISOString(),
  });
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      pages: racines.map(serialise),
      space: {
        createdAt: new Date(espace.createdAt).toISOString(),
        description: espace.description,
        name: espace.name,
      },
    },
    null,
    2
  );
}

/**
 * Titre → slug lisible, sans accent ni caractère interdit.
 *
 * `normalize("NFKD")` seul ne suffit pas : il DÉCOMPOSE « é » en « e » + accent
 * combinant, et cet accent n'est ni une lettre ni un chiffre — il était donc
 * remplacé par un tiret, et « Réunion » s'appelait « re-union ». Les marques
 * doivent être retirées APRÈS la décomposition : un titre français est le cas
 * courant ici, pas un coin de test.
 */
export function slugDeTitre(titre: string, longueurMax = 48): string {
  return titre
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, longueurMax);
}

/**
 * Nom de fichier d'une page : lisible, sans caractère interdit, unique.
 *
 * Le titre seul ne suffit pas : deux pages « Réunion » dans le même Espace
 * produiraient deux entrées ZIP homonymes, et la seconde écraserait la
 * première sans un mot.
 */
export function nomDeFichierPage(titrePage: string, index: number): string {
  const numero = String(index + 1).padStart(2, "0");
  return `${numero}-${slugDeTitre(titrePage) || "page"}.md`;
}

/** Fichiers du ZIP : `README.md` + une page par fichier, chemin = arbre. */
export function fichiersExport(
  espace: EnTeteEspace,
  racines: NoeudExport[]
): Record<string, string> {
  verifierBornes(racines);
  const fichiers: Record<string, string> = {
    "README.md": espaceEnMarkdown(espace, racines),
  };
  let index = 0;
  const parcourir = (noeuds: NoeudExport[], chemin: string[]): void => {
    for (const noeud of noeuds) {
      const nom = nomDeFichierPage(noeud.page.title, index);
      index += 1;
      const morceau = [...chemin, nom];
      fichiers[morceau.join("/")] = [
        titre(chemin.length, noeud.page.title),
        "",
        noeud.page.content.trim() || "_(vide)_",
        "",
      ].join("\n");
      // Une sous-page est rangée dans un dossier du nom de sa parente : un ZIP
      // à plat perd la hiérarchie que Markdown, lui, garde.
      const nomDossier = nom.replace(/\.md$/, "");
      if (noeud.children.length > 0)
        parcourir(noeud.children, [...morceau.slice(0, -1), nomDossier]);
    }
  };
  parcourir(racines, []);
  verifierVolume(
    Object.values(fichiers).reduce(
      (total, contenu) => total + contenu.length,
      0
    )
  );
  return fichiers;
}

function verifierBornes(racines: NoeudExport[]): void {
  let total = 0;
  const compter = (noeuds: NoeudExport[]): void => {
    for (const noeud of noeuds) {
      total += 1;
      compter(noeud.children);
    }
  };
  compter(racines);
  if (total > LIMITES_EXPORT.pagesMax) {
    throw new ErreurExport(
      `Cet Espace contient ${total} pages, plus que les ${LIMITES_EXPORT.pagesMax} d'un export. Exportez page par page.`
    );
  }
}

/**
 * Le volume est compté sur le RÉSULTAT, pas sur les pages seules : une arborescence
 * de trois cents titres et front-matter peut dépasser la borne sans qu'aucune
 * page ne soit trop longue.
 */
function verifierVolume(texte: string | number): void {
  const caracteres = typeof texte === "number" ? texte : texte.length;
  if (caracteres > LIMITES_EXPORT.caracteresMax) {
    throw new ErreurExport(
      "Cet Espace est trop volumineux pour un export d'un coup. Exportez page par page."
    );
  }
}
