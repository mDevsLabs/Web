import "server-only";

/**
 * Verser une pièce jointe du chat dans la bibliothèque cloud mAI.
 *
 * POURQUOI LE SERVEUR RELIT LE BLOB PLUTÔT QUE DE FAIRE DOUBLE-UPLOADER
 *
 * Le navigateur a déjà envoyé le fichier une fois (`/api/files/upload`, Vercel
 * Blob). Le lui faire envoyer une seconde fois vers `/api/library` coûterait
 * deux fois la bande passante de l'utilisateur pour un même octet, et
 * rapprocherait le quota d'une simple promesse du client. Ici le serveur relit
 * le blob privé — dont il connaît la taille et le type RÉELS — et ne les
 * demande plus au navigateur.
 *
 * LE QUOTA EST UNE DÉCISION SERVEUR, AVANT TOUTE LECTURE
 *
 * `quotaBibliotheque` est appelée AVANT que le contenu soit téléchargé : un
 * refus doit être gratuit à répéter. Lire trente mégaoctets pour les jeter
 * après coup paierait deux fois la même erreur.
 *
 * La bibliothèque cloud amont et le stockage des pièces jointes du chat sont
 * DEUX surfaces distinctes (`docs/3-wakies/INTEGRATION.md`) : verser l'une dans
 * l'autre est un choix de l'utilisateur, pas une synchronisation implicite.
 */

import { upstreamForm, upstreamJson } from "@/lib/api/upstream";
import { getTierStorageBytes } from "@/lib/plans/tier-limits";

export type EtatBibliotheque = {
  bytesLimit: number;
  bytesUsed: number;
  /** La source fait foi : `forfait` signifie que l'amont n'a pas répondu. */
  source: "amont" | "forfait";
  /** Vrai seulement quand l'amont a répondu ET que la place manque. */
  overLimit: boolean;
};

/** Panne amont ≠ bibliothèque pleine : les deux se disent différemment. */
export async function quotaBibliotheque(params: {
  tier: string;
  token: string | null;
}): Promise<EtatBibliotheque> {
  const repli = Number(getTierStorageBytes(params.tier)) || 0;
  if (!params.token) {
    return {
      bytesLimit: repli,
      bytesUsed: 0,
      overLimit: false,
      source: "forfait",
    };
  }
  const storage = await upstreamJson<Record<string, unknown>>({
    path: "/cloud/storage",
    token: params.token,
  });
  if (!storage.ok || !storage.data) {
    return {
      bytesLimit: repli,
      bytesUsed: 0,
      overLimit: false,
      source: "forfait",
    };
  }
  const bytesLimit = Number(storage.data.bytes_limit) || repli;
  const bytesUsed = Number(storage.data.bytes_used) || 0;
  return {
    bytesLimit,
    bytesUsed,
    // Une limite inconnue (0) ne vaut pas « plus aucune place ».
    overLimit: bytesLimit > 0 && bytesUsed + 1 > bytesLimit,
    source: "amont",
  };
}

/**
 * Copie un fichier déjà stocké dans la bibliothèque cloud.
 *
 * `dejaPresent` se juge sur le nom et la taille côté amont : renvoyer un
 * identifiant neuf pour un doublon ferait grossir la bibliothèque à chaque
 * envoi du même document.
 */
export async function verserVersBibliotheque(params: {
  contenu: Uint8Array;
  contentType: string;
  nom: string;
  token: string | null;
}): Promise<{ id: string | null; dejaPresent: boolean }> {
  if (!params.token)
    throw new Error("Session introuvable pour la bibliothèque.");
  const inventaire = await upstreamJson<{
    files?: { filename?: string; size?: number }[];
  }>({
    path: "/cloud/files",
    token: params.token,
  });
  const fichiers = inventaire.ok ? (inventaire.data.files ?? []) : [];
  const dejaPresent = fichiers.some(
    (fichier) => fichier.filename === params.nom
  );
  // `BlobPart` exige un ArrayBuffer détenu : les buffers venant d'un flux
  // réseau peuvent aussi référencer un SharedArrayBuffer.
  const contenu = Uint8Array.from(params.contenu);
  const form = new FormData();
  form.append(
    "file",
    new Blob([contenu.buffer], { type: params.contentType }),
    params.nom
  );
  const envoi = await upstreamForm<{ id?: string; file?: { id?: string } }>({
    form,
    path: "/cloud/upload",
    // Un envoi de fichier dépasse le délai JSON par défaut.
    timeoutMs: 120_000,
    token: params.token,
  });
  if (!envoi.ok) {
    throw new Error(
      (envoi.payload as { message?: string })?.message ??
        "La bibliothèque a refusé le fichier."
    );
  }
  return {
    dejaPresent,
    id: envoi.data?.id ?? envoi.data?.file?.id ?? null,
  };
}
