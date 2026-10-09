"use client";

/**
 * ============================================================================
 * Pièces jointes du composer Wakies
 * ============================================================================
 *
 * CYCLE DE VIE D'UN TELEVERSEMENT
 *
 *   sélectionné   le fichier est choisi localement, rien n'est encore parti ;
 *                 nom, taille et type sont déjà connus, l'aperçu est local.
 *   envoi         `POST /api/files/upload` est en cours.
 *   prêt          le serveur a renvoyé un `pathname`. C'est LE SEUL durable :
 *                 l'URL signée expire en dix minutes et n'est jamais stockée.
 *   échec         le serveur a refusé (format, taille). Le texte de la demande
 *                 reste dans le composer.
 *
 * LE RETIRAGE EST IMMÉDIAT ET DÉFINITIF
 *
 * Cliquer sur la croix marque le fichier `retire`. Une réponse de téléversement
 * qui arrive APRÈS ce clic est ignorée : sans ce drapeau, un fichier retiré
 * réapparaîtrait dans le composer parce que sa requête était encore en vol. Le
 * `retire` est mémorisé par `idLocal`, jamais par l'identité du fichier distant.
 *
 * CE QUI EST ENVOYÉ AU MODÈLE
 *
 * Le `pathname` et les métadonnées, jamais l'URL signée et jamais le contenu.
 * Le modèle ne lit pas un fichier par son URL : `read_file` le résout côté
 * serveur, depuis la bibliothèque du propriétaire.
 *
 * FORMATS
 *
 * La liste ci-dessous est celle du handler d'upload, pas celle d'un parseur :
 * announcing un format que le téléversement refuse serait un mensonge de
 * l'interface. HTML, JavaScript et SVG actif sont exclus côté serveur, et le
 * sont donc ici aussi.
 */

/** Formats réellement acceptés par `POST /api/files/upload`. */
export const FORMATS_TELEVERSABLES: Record<string, string> = {
  "application/json": "JSON",
  "application/pdf": "PDF",
  "image/gif": "GIF",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "text/csv": "CSV",
  "text/markdown": "Markdown",
  "text/plain": "Texte",
};

/** Types refusés même s'ils passent un filtre `text/*` ou `image/*`. */
export const FORMATS_REFUSES = [
  "text/html",
  "text/javascript",
  "image/svg+xml",
];

/** 50 Mo par fichier — la borne du handler d'upload. */
export const TAILLE_MAX = 50 * 1024 * 1024;

export type EtatPiece = {
  /** Identifiant local, stable pendant toute la vie du brouillon. */
  idLocal: string;
  /** Nom affiché, assaini. */
  nom: string;
  /** Taille en octets. */
  taille: number;
  /** Type MIME déclaré. */
  type: string;
  /** Objet local, pour l'aperçu image. Relâché après téléversement. */
  fichier?: File;
  /** `pathname` du blob privé, une fois le téléversement réussi. */
  pathname?: string;
  /** Progression 0→1 pendant l'envoi. */
  progression: number;
  etat: "selectionne" | "envoi" | "pret" | "echec";
  /** Message d'erreur en français, quand `etat === "echec"`. */
  erreur?: string;
  /** L'utilisateur a retiré le fichier : plus rien ne doit le réinsérer. */
  retire?: boolean;
};

let compteur = 0;

/** Un ticket local, sans effet de bord. */
export function pieceSelectionnee(fichier: File): EtatPiece {
  compteur += 1;
  const refus = motifRefus(fichier);
  return {
    erreur: refus ?? undefined,
    etat: refus ? "echec" : "selectionne",
    fichier,
    idLocal: `piece-${compteur}-${fichier.size}`,
    nom: assainirNom(fichier.name),
    progression: 0,
    taille: fichier.size,
    type: fichier.type || "application/octet-stream",
  };
}

/** Le fichier est-il refusé avant même d'être envoyé ? */
export function motifRefus(fichier: File): string | null {
  if (FORMATS_REFUSES.includes(fichier.type)) {
    return "Ce format n'est pas accepté. Utilisez du texte, une image ou un PDF.";
  }
  if (fichier.size > TAILLE_MAX) {
    return "Ce fichier dépasse 50 Mo. Choisissez-en un plus léger.";
  }
  if (
    !FORMATS_TELEVERSABLES[fichier.type] &&
    !fichier.type.startsWith("image/")
  ) {
    return "Ce format n'est pas accepté. Utilisez du texte, une image ou un PDF.";
  }
  return null;
}

/**
 * Nom assaini pour l'affichage.
 *
 * Le serveur assainit déjà le nom stocké, mais l'interface affiche le nom
 * COURANT : sans cela, un nom contenant des caractères de contrôle ou un
 * bidi malveillant s'afficherait à l'envers dans le composer.
 */
export function assainirNom(nom: string): string {
  // Les caractères de contrôle effacent l'affichage ; les caractères de
  // direction BIDIS peuvent réécrire l'apparence du nom. On les retire tous,
  // dans une seule passe : le nom affiché doit être exactement le nom stocké.
  const sansInvisibles = nom.replace(
    // biome-ignore lint/suspicious/noControlCharactersInRegex: on retire volontairement ces caractères
    /[\u0000-\u001F\u007F-\u009F\u200E\u200F\u202A-\u202E\u2066-\u2069]/g,
    ""
  );
  return (sansInvisibles.trim() || "fichier").slice(0, 120);
}

/** Taille lisible, en français. */
export function formaterTaille(octets: number): string {
  if (octets < 1024) {
    return `${octets} o`;
  }
  if (octets < 1024 * 1024) {
    return `${Math.round(octets / 1024)} Ko`;
  }
  return `${(octets / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

export type ReponseUpload = {
  pathname: string;
  url: string;
};

/**
 * Téléverse un fichier et renvoie son `pathname` durable.
 *
 * L'URL signée est IGNORÉE par l'appelant : c'est le `pathname` qui est
 * persisté, et la route qui relit l'historique re-signe au moment de l'afficher.
 */
export async function televerser(
  fichier: File,
  signal?: AbortSignal
): Promise<ReponseUpload> {
  const corps = new FormData();
  corps.append("file", fichier);
  const reponse = await fetch("/api/files/upload", {
    body: corps,
    credentials: "same-origin",
    method: "POST",
    signal,
  });
  if (!reponse.ok) {
    const donnees = (await reponse.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(donnees?.message ?? "Ce fichier n'a pas pu être envoyé.");
  }
  const donnees = (await reponse.json()) as {
    pathname?: string;
    url?: string;
  };
  if (!donnees.pathname) {
    throw new Error("Le serveur n'a pas renvoyé de fichier exploitable.");
  }
  return { pathname: donnees.pathname, url: donnees.url ?? "" };
}

/**
 * Part de message telle qu'elle est enregistrée dans `WakiesMessage`.
 *
 * `mediaType` est borné et `pathname` est celui du serveur : un client ne
 * peut pas faire porter un chemin arbitraire, et la route qui relit
 * l'historique revérifie de toute façon l'namespace du compte.
 */
export function partDePiece(piece: EtatPiece) {
  return {
    fileName: piece.nom,
    mediaType: piece.type,
    pathname: piece.pathname,
    size: piece.taille,
    type: "file" as const,
  };
}
