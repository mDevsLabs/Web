// Garde-fous sur les archives téléchargées (DOCX = ZIP, ainsi que tout format
// bureautique OOXML).
//
// Un DOCX de 200 Ko peut déclarer plusieurs gigaoctets de contenu décompressé :
// le plafond d'octets du téléchargement (lib/web/safe-fetch.ts) ne protège donc
// PAS contre une bombe de décompression. On lit ici l'annuaire central du ZIP
// AVANT de confier les octets à une bibliothèque d'extraction, et on refuse les
// archives trop grosses, trop nombreuses ou déclarant des tailles zip64.
//
// Testé par tests/unit/zip-guard.test.ts (buffers synthétiques, aucun réseau).

export const ZIP_MAX_ENTRIES = 2_000;
export const ZIP_MAX_TOTAL_UNCOMPRESSED_BYTES = 200 * 1024 * 1024; // 200 Mo

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const EOCD_MIN_SIZE = 22;
const MAX_COMMENT_SIZE = 65_535;

export type ZipInspection =
  | { entries: number; ok: true; totalUncompressedBytes: number }
  | { error: string; ok: false };

function findEocdOffset(buffer: Buffer): number {
  const earliest = Math.max(0, buffer.length - EOCD_MIN_SIZE - MAX_COMMENT_SIZE);
  for (let offset = buffer.length - EOCD_MIN_SIZE; offset >= earliest; offset -= 1) {
    if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) {
      return offset;
    }
  }
  return -1;
}

/**
 * Inspecte l'annuaire central d'une archive ZIP.
 * `ok: false` signifie « ne pas analyser cette archive » — jamais « au cas où ».
 */
export function inspectZipArchive(
  buffer: Buffer,
  limits: {
    maxEntries?: number;
    maxTotalUncompressedBytes?: number;
  } = {}
): ZipInspection {
  const maxEntries = limits.maxEntries ?? ZIP_MAX_ENTRIES;
  const maxTotal = limits.maxTotalUncompressedBytes ?? ZIP_MAX_TOTAL_UNCOMPRESSED_BYTES;

  if (buffer.length < EOCD_MIN_SIZE) {
    return { error: "Archive trop courte pour être un ZIP valide.", ok: false };
  }
  const eocd = findEocdOffset(buffer);
  if (eocd < 0) {
    return { error: "Annuaire central ZIP introuvable.", ok: false };
  }

  const declaredEntries = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  const centralOffset = buffer.readUInt32LE(eocd + 16);

  if (
    declaredEntries === 0xffff ||
    centralSize === 0xffffffff ||
    centralOffset === 0xffffffff
  ) {
    // zip64 : les tailles réelles ne sont pas dans l'annuaire central classique.
    return { error: "Archive ZIP64 refusée (tailles non vérifiables).", ok: false };
  }
  if (declaredEntries > maxEntries) {
    return {
      error: `Archive refusée : ${declaredEntries} entrées (max ${maxEntries}).`,
      ok: false,
    };
  }
  if (centralOffset + centralSize > buffer.length) {
    return { error: "Annuaire central ZIP incohérent avec le fichier.", ok: false };
  }

  let offset = centralOffset;
  let entries = 0;
  let totalUncompressedBytes = 0;

  for (let index = 0; index < declaredEntries; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== CENTRAL_SIGNATURE) {
      return { error: "Entrée ZIP illisible (annuaire corrompu).", ok: false };
    }
    const uncompressed = buffer.readUInt32LE(offset + 24);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const nameLength = buffer.readUInt16LE(offset + 28);

    if (uncompressed === 0xffffffff) {
      return { error: "Entrée ZIP64 refusée (taille non vérifiable).", ok: false };
    }
    entries += 1;
    totalUncompressedBytes += uncompressed;
    if (entries > maxEntries) {
      return { error: `Archive refusée : plus de ${maxEntries} entrées.`, ok: false };
    }
    if (totalUncompressedBytes > maxTotal) {
      return {
        error: `Archive refusée : ${totalUncompressedBytes} octets décompressés annoncés (max ${maxTotal}).`,
        ok: false,
      };
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return { entries, ok: true, totalUncompressedBytes };
}

/** Vrai si les octets ressemblent à une archive ZIP (DOCX, XLSX, PPTX…). */
export function looksLikeZip(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07)
  );
}

/** Vrai si les octets commencent par l'en-tête PDF. */
export function looksLikePdf(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString("latin1") === "%PDF-";
}

/**
 * Vérifie la cohérence déclaré/observé d'un document avant extraction.
 * Le type MIME vient d'un serveur tiers : il ne doit jamais décider seul du
 * chemin d'analyse (un `.pdf` servi en `text/html` ne doit pas partir dans le
 * parseur PDF, et inversement).
 */
export function checkDocumentShape(params: {
  buffer: Buffer;
  contentType: string;
  urlLower: string;
}): { kind: "docx" | "pdf" | "other"; error?: string } {
  const { buffer, contentType, urlLower } = params;
  const wantsPdf = contentType.includes("pdf") || urlLower.endsWith(".pdf");
  const wantsDocx =
    contentType.includes("wordprocessingml") || urlLower.endsWith(".docx");

  if (wantsPdf && !looksLikePdf(buffer)) {
    return {
      error: "Le contenu ne correspond pas à un PDF (en-tête %PDF- absent).",
      kind: "other",
    };
  }
  if (wantsDocx) {
    if (!looksLikeZip(buffer)) {
      return {
        error: "Le contenu ne correspond pas à un DOCX (archive ZIP absente).",
        kind: "other",
      };
    }
    const inspection = inspectZipArchive(buffer);
    if (!inspection.ok) {
      return { error: inspection.error, kind: "other" };
    }
    return { kind: "docx" };
  }
  if (contentType.includes("zip")) {
    return { error: "Archives ZIP refusées : convertissez le fichier.", kind: "other" };
  }
  return { kind: wantsPdf ? "pdf" : "other" };
}
