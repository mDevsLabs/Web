/**
 * Détection du type RÉEL d'une image à partir de ses octets.
 *
 * Le `Content-Type` d'un serveur distant est déclaratif : il peut annoncer
 * `image/png` et servir du HTML. Le proxy d'images ne relaie donc que les
 * formats raster dont la signature est vérifiée. SVG est volontairement exclu :
 * servi sous l'origine mAI, un SVG peut exécuter du script.
 */

export type SniffedImageType =
  | "image/avif"
  | "image/bmp"
  | "image/gif"
  | "image/jpeg"
  | "image/png"
  | "image/tiff"
  | "image/webp"
  | "image/x-icon";

function bytesAt(buffer: Uint8Array, offset: number, length: number): string {
  if (buffer.length < offset + length) return "";
  return String.fromCharCode(...buffer.subarray(offset, offset + length));
}

export function sniffImageType(buffer: Uint8Array): SniffedImageType | null {
  if (buffer.length < 4) return null;

  // PNG : signature complète sur 8 octets.
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG : SOI puis marqueur.
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // GIF87a / GIF89a.
  if (
    bytesAt(buffer, 0, 6) === "GIF87a" ||
    bytesAt(buffer, 0, 6) === "GIF89a"
  ) {
    return "image/gif";
  }

  // WebP : conteneur RIFF dont le type est WEBP.
  if (bytesAt(buffer, 0, 4) === "RIFF" && bytesAt(buffer, 8, 4) === "WEBP") {
    return "image/webp";
  }

  // AVIF / AVIS : boîte ISO BMFF ftyp.
  if (bytesAt(buffer, 4, 4) === "ftyp") {
    const brand = bytesAt(buffer, 8, 4);
    if (brand === "avif" || brand === "avis") {
      return "image/avif";
    }
  }

  // BMP.
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return "image/bmp";
  }

  // ICO / CUR.
  if (
    buffer[0] === 0x00 &&
    buffer[1] === 0x00 &&
    (buffer[2] === 0x01 || buffer[2] === 0x02) &&
    buffer[3] === 0x00
  ) {
    return "image/x-icon";
  }

  // TIFF little-endian / big-endian.
  if (
    (buffer[0] === 0x49 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x2a &&
      buffer[3] === 0x00) ||
    (buffer[0] === 0x4d &&
      buffer[1] === 0x4d &&
      buffer[2] === 0x00 &&
      buffer[3] === 0x2a)
  ) {
    return "image/tiff";
  }

  return null;
}
