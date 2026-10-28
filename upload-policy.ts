/**
 * Politique des uploads publics vers le stockage.
 *
 * `text/html`, les scripts et le SVG actif ne sont jamais acceptés, même
 * déguisés derrière `text/*` ou `image/*`. Pour les images, le MIME déclaré ne
 * suffit pas : la signature binaire est vérifiée et le type servi est celui
 * réellement détecté. Les documents sont servis en pièce jointe ; les médias
 * (images raster, audio, vidéo) en ligne. Un MIME absent n'est accepté que si
 * le contenu prouve qu'il s'agit d'une image raster connue.
 *
 * Module pur, sans import Deno/Next — testé unitairement.
 */

export type UploadMode = "any" | "image";

export type UploadDecision =
  | {
      ok: true;
      contentType: string;
      disposition: "attachment" | "inline";
    }
  | { ok: false; error: string };

const SAFE_RASTER_TYPES = new Set([
  "image/avif",
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/webp",
  "image/x-icon",
]);

const SAFE_AUDIO_VIDEO_TYPES = new Set([
  "audio/aac",
  "audio/flac",
  "audio/m4a",
  "audio/mp3",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/opus",
  "audio/wav",
  "audio/webm",
  "video/mp4",
  "video/ogg",
  "video/quicktime",
  "video/webm",
]);

const ATTACHMENT_TYPES = new Set([
  "application/json",
  "application/msword",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "text/markdown",
  "text/plain",
]);

export function sniffRasterImageMime(bytes: Uint8Array): string | null {
  if (bytes.length < 4) return null;
  const ascii = (offset: number, length: number): string =>
    bytes.length < offset + length
      ? ""
      : String.fromCharCode(...bytes.subarray(offset, offset + length));

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") {
    return "image/gif";
  }
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    return "image/webp";
  }
  if (ascii(4, 4) === "ftyp") {
    const brand = ascii(8, 4);
    if (brand === "avif" || brand === "avis") return "image/avif";
  }
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return "image/bmp";
  if (
    bytes[0] === 0x00 &&
    bytes[1] === 0x00 &&
    (bytes[2] === 0x01 || bytes[2] === 0x02) &&
    bytes[3] === 0x00
  ) {
    return "image/x-icon";
  }
  if (
    (bytes[0] === 0x49 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x2a &&
      bytes[3] === 0x00) ||
    (bytes[0] === 0x4d &&
      bytes[1] === 0x4d &&
      bytes[2] === 0x00 &&
      bytes[3] === 0x2a)
  ) {
    return "image/tiff";
  }
  return null;
}

/**
 * Décide du type réellement servi, ou refuse. Le mode `image` n'autorise que
 * les images raster (avatars), jamais un document ou un SVG.
 */
export function decidePublicUpload(params: {
  bytes: Uint8Array;
  declaredType: string;
  mode: UploadMode;
}): UploadDecision {
  const declared = String(params.declaredType || "")
    .trim()
    .toLowerCase();
  const sniffed = sniffRasterImageMime(params.bytes);

  // Le SVG et le HTML sont refusés même si le parsing binaire est ambigu.
  if (
    declared === "image/svg+xml" ||
    declared === "text/html" ||
    declared === "application/xhtml+xml" ||
    declared === "text/xml" ||
    declared === "application/xml" ||
    declared === "application/javascript" ||
    declared === "text/javascript" ||
    declared === "application/x-javascript" ||
    declared === "application/ecmascript"
  ) {
    return { error: "Type de fichier actif non autorisé.", ok: false };
  }

  if (declared.startsWith("image/")) {
    if (!SAFE_RASTER_TYPES.has(declared)) {
      return {
        error: "Format d'image non autorisé (image raster uniquement).",
        ok: false,
      };
    }
    if (!sniffed) {
      // Un fichier déclaré image mais sans signature connue (HTML/SVG/script
      // déguisé) est refusé.
      return {
        error: "Le contenu ne correspond pas à une image valide.",
        ok: false,
      };
    }
    return { contentType: sniffed, disposition: "inline", ok: true };
  }

  // MIME absent : seule une image raster reconnue par sa signature est
  // acceptée ; sinon la décision serait prise « à l'aveugle ».
  if (!declared) {
    if (sniffed) {
      return { contentType: sniffed, disposition: "inline", ok: true };
    }
    return { error: "Type de fichier manquant.", ok: false };
  }

  if (params.mode === "image") {
    return { error: "Une image est requise.", ok: false };
  }

  if (SAFE_AUDIO_VIDEO_TYPES.has(declared)) {
    return { contentType: declared, disposition: "inline", ok: true };
  }

  if (ATTACHMENT_TYPES.has(declared)) {
    return { contentType: declared, disposition: "attachment", ok: true };
  }

  return { error: "Type de fichier non autorisé.", ok: false };
}
