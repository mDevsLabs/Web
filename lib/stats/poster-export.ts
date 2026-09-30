"use client";

// Export et partage de l'affiche de statistiques.
//
// Le SVG est produit par `lib/stats/poster.ts` (pur, testable) ; ce module ne
// s'occupe que de la conversion en fichier et de sa destination.
//
// Précaution canvas obligatoire : une image rasterisée qui proviendrait d'une
// ressource tierce « taint » le canvas, et `toBlob` échoue silencieusement. On
// reste donc sur un SVG issue d'un blob local, sans référence externe : le
// `drawImage` n'est jamais conditionné par `foreignObject` (que Safari refuse
// déjà) ni par des polices web (inaccessibles dans un document isolé).

type BlobWithName = File;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Libéré au tick suivant : Safari annule parfois le téléchargement si l'URL
  // est révoquée dans la même tâche que le clic.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toFile(blob: Blob, filename: string): BlobWithName {
  return new File([blob], filename, { type: blob.type });
}

/** Sérialise l'affiche en fichier SVG téléchargeable. */
export function downloadPosterSvg(svg: string, filename: string): void {
  downloadBlob(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
    filename
  );
}

/**
 * Rasterise l'affiche en PNG à 2×.
 *
 * Le facteur 2 est ce qui rend l'image lisible une fois envoyée dans une
 * messagerie : à 1×, un texte de 11 px devient illisible une fois réduit.
 */
export async function renderPosterPng(
  svg: string,
  options: { height: number; scale?: number; width: number }
): Promise<Blob> {
  const { height, scale = 2, width } = options;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error("Le rendu de l'affiche en image a échoué."));
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas indisponible sur ce navigateur.");
    }
    // L'affiche porte déjà son fond (rectangle de la palette) : on ne peint
    // rien derrière, sinon un PNG transparent s'afficherait mal dans certains
    // lecteurs.
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const png = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!png) {
      throw new Error("Conversion en PNG impossible.");
    }
    return png;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function downloadPosterPng(
  svg: string,
  filename: string,
  size: { height: number; width: number }
): Promise<void> {
  const png = await renderPosterPng(svg, size);
  downloadBlob(png, filename);
}

/** Copie l'affiche dans le presse-papiers, pour la coller dans une app. */
export async function copyPosterToClipboard(png: Blob): Promise<void> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    throw new Error(
      "Ce navigateur ne permet pas de copier une image dans le presse-papiers."
    );
  }
  // `navigator.clipboard.write` n'existe qu'en contexte sécurisé (HTTPS, ou
  // localhost) : sur une origine simple en HTTP, l'appel est absent ou
  // refusé. Le message ci-dessus couvre les deux cas.
  await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
}

/** Le partage natif est-il réellement disponible ici ? */
export function canShareFiles(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"
  );
}

/**
 * Partage via la feuille système, en passant le PNG comme pièce jointe.
 *
 * Pourquoi passer par là plutôt que par des liens `https://wa.me/?text=…` ou
 * `twitter.com/intent/tweet` : ces API web n'acceptent qu'une URL publicly
 * accessible, jamais un fichier local. Or la page Statistiques est
 * authentifiée — il n'existe aucune URL partageable. Un lien « vers ma
 * statistique » serait donc soit mort, soit une fuite de donnée personnelle.
 * `navigator.share` est le seul chemin qui transporte réellement l'image vers
 * WhatsApp, Telegram, iMessage, Discord, Slack ou AirDrop.
 */
export async function sharePoster(
  png: Blob,
  options: { filename: string; text: string }
): Promise<"shared" | "unsupported"> {
  if (!canShareFiles()) {
    return "unsupported";
  }
  const file = toFile(png, options.filename);
  if (!navigator.canShare({ files: [file] })) {
    return "unsupported";
  }
  await navigator.share({ files: [file], text: options.text });
  return "shared";
}
