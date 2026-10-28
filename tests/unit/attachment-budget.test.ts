import { describe, expect, it } from "vitest";
import { planAttachmentBatch } from "@/lib/chat/attachment-budget";

const MB = 1024 * 1024;

describe("Budget de pièces jointes — sélections simultanées", () => {
  it("deux sélections de 3 fichiers ne dépassent jamais 4 places", () => {
    let reservedFiles = 0;
    let reservedBytes = 0;
    const first = planAttachmentBatch(
      [{ size: MB }, { size: MB }, { size: MB }],
      {
        maxBytes: 50 * MB,
        maxFiles: 4,
        reservedBytes,
        reservedFiles,
        usedBytes: 0,
        usedFiles: 0,
      }
    );
    reservedFiles += first.acceptedIndexes.length;
    reservedBytes += first.acceptedBytes;

    const second = planAttachmentBatch(
      [{ size: MB }, { size: MB }, { size: MB }],
      {
        maxBytes: 50 * MB,
        maxFiles: 4,
        reservedBytes,
        reservedFiles,
        usedBytes: 0,
        usedFiles: 0,
      }
    );

    expect(first.acceptedIndexes).toHaveLength(3);
    expect(second.acceptedIndexes).toHaveLength(1);
    expect(second.rejectedBySlots).toBe(2);
    expect(reservedFiles + second.acceptedIndexes.length).toBe(4);
  });

  it("deux sélections de 30 Mo ne dépassent pas 50 Mo", () => {
    const first = planAttachmentBatch([{ size: 30 * MB }], {
      maxBytes: 50 * MB,
      maxFiles: 4,
      reservedBytes: 0,
      reservedFiles: 0,
      usedBytes: 0,
      usedFiles: 0,
    });
    const second = planAttachmentBatch([{ size: 30 * MB }], {
      maxBytes: 50 * MB,
      maxFiles: 4,
      reservedBytes: first.acceptedBytes,
      reservedFiles: first.acceptedIndexes.length,
      usedBytes: 0,
      usedFiles: 0,
    });
    expect(first.acceptedIndexes).toEqual([0]);
    expect(second.acceptedIndexes).toEqual([]);
    expect(second.rejectedByBytes).toBe(1);
  });

  it("libère la réservation d'un échec avant de réessayer", () => {
    const reserved = planAttachmentBatch([{ size: 20 * MB }], {
      maxBytes: 50 * MB,
      maxFiles: 4,
      reservedBytes: 0,
      reservedFiles: 0,
      usedBytes: 40 * MB,
      usedFiles: 2,
    });
    expect(reserved.acceptedIndexes).toEqual([]);
    // Échec : les 0 octets réservés sont rendus (rien n'avait été posé) et la
    // place reste disponible pour un fichier plus petit.
    const retry = planAttachmentBatch([{ size: 5 * MB }], {
      maxBytes: 50 * MB,
      maxFiles: 4,
      reservedBytes: 0,
      reservedFiles: 0,
      usedBytes: 40 * MB,
      usedFiles: 2,
    });
    expect(retry.acceptedIndexes).toEqual([0]);
  });

  it("compte les fichiers déjà confirmés dans les deux bornes", () => {
    const plan = planAttachmentBatch(
      [{ size: MB }, { size: MB }, { size: MB }],
      {
        maxBytes: 50 * MB,
        maxFiles: 4,
        reservedBytes: 0,
        reservedFiles: 0,
        usedBytes: 0,
        usedFiles: 3,
      }
    );
    expect(plan.acceptedIndexes).toEqual([0]);
    expect(plan.rejectedBySlots).toBe(2);
  });

  it("accepte un lot vide sans erreur", () => {
    expect(
      planAttachmentBatch([], {
        maxBytes: 50 * MB,
        maxFiles: 4,
        reservedBytes: 0,
        reservedFiles: 0,
        usedBytes: 0,
        usedFiles: 0,
      })
    ).toEqual({
      acceptedBytes: 0,
      acceptedIndexes: [],
      rejectedByBytes: 0,
      rejectedBySlots: 0,
    });
  });
});
