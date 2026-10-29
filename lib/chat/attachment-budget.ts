/**
 * Planification d'un lot de pièces jointes sous budget PARTAGÉ.
 *
 * Le bug : deux sélections rapprochées lisaient le même état confirmé
 * (`attachments.length`, octets déjà envoyés) avant le premier `await` et
 * pouvaient ajouter 6 fichiers ou 60 Mo. La décision doit réserver
 * SYNCHRONEMENT les places et les octets des envois EN COURS, avant toute
 * opération asynchrone. Ce module ne fait que la décision ; l'appelant pose la
 * réservation, puis la libère selon succès/échec/annulation.
 */

export type AttachmentBudgetSnapshot = {
  maxBytes: number;
  maxFiles: number;
  /** Fichiers déjà confirmés dans le message. */
  usedFiles: number;
  /** Octets déjà confirmés. */
  usedBytes: number;
  /** Place et octets réservés par des envois en vol. */
  reservedBytes: number;
  reservedFiles: number;
};

export type AttachmentBatchPlan = {
  acceptedBytes: number;
  acceptedIndexes: number[];
  rejectedByBytes: number;
  rejectedBySlots: number;
};

export function planAttachmentBatch(
  files: ReadonlyArray<{ size: number }>,
  budget: AttachmentBudgetSnapshot
): AttachmentBatchPlan {
  const freeFiles = Math.max(
    0,
    budget.maxFiles - budget.usedFiles - budget.reservedFiles
  );
  let projectedBytes = budget.usedBytes + budget.reservedBytes;
  const acceptedIndexes: number[] = [];
  let rejectedBySlots = 0;
  let rejectedByBytes = 0;

  for (let index = 0; index < files.length; index += 1) {
    const size = Number.isFinite(files[index]?.size) ? files[index].size : 0;
    if (acceptedIndexes.length >= freeFiles) {
      rejectedBySlots += 1;
      continue;
    }
    if (projectedBytes + size > budget.maxBytes) {
      rejectedByBytes += 1;
      continue;
    }
    acceptedIndexes.push(index);
    projectedBytes += size;
  }

  return {
    acceptedBytes: acceptedIndexes.reduce(
      (total, index) => total + (files[index]?.size ?? 0),
      0
    ),
    acceptedIndexes,
    rejectedByBytes,
    rejectedBySlots,
  };
}
