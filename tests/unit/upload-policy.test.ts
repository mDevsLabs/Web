import { describe, expect, it } from "vitest";
import { decidePublicUpload, sniffRasterImageMime } from "../../upload-policy";

const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02,
]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const HTML = new TextEncoder().encode(
  "<!DOCTYPE html><script>alert(1)</script>"
);
const SVG = new TextEncoder().encode('<svg onload="alert(1)"></svg>');

describe("Uploads publics — types actifs et MIME mensonger", () => {
  it("accepte une vraie image PNG et sert son type détecté", () => {
    expect(
      decidePublicUpload({ bytes: PNG, declaredType: "image/png", mode: "any" })
    ).toEqual({
      contentType: "image/png",
      disposition: "inline",
      ok: true,
    });
    expect(
      decidePublicUpload({
        bytes: PNG,
        declaredType: "image/jpeg",
        mode: "any",
      })
    ).toMatchObject({ contentType: "image/png", ok: true });
  });

  it("refuse text/html et le SVG même déclarés comme images", () => {
    expect(
      decidePublicUpload({
        bytes: HTML,
        declaredType: "text/html",
        mode: "any",
      }).ok
    ).toBe(false);
    expect(
      decidePublicUpload({
        bytes: SVG,
        declaredType: "image/svg+xml",
        mode: "any",
      }).ok
    ).toBe(false);
    // HTML déguisé en image/png : signature absente.
    expect(
      decidePublicUpload({
        bytes: HTML,
        declaredType: "image/png",
        mode: "any",
      }).ok
    ).toBe(false);
    // SVG déguisé en image/jpeg.
    expect(
      decidePublicUpload({
        bytes: SVG,
        declaredType: "image/jpeg",
        mode: "image",
      }).ok
    ).toBe(false);
  });

  it("refuse un type absent si le contenu n'est pas une image reconnue", () => {
    expect(
      decidePublicUpload({ bytes: HTML, declaredType: "", mode: "any" }).ok
    ).toBe(false);
    expect(
      decidePublicUpload({ bytes: PNG, declaredType: "", mode: "any" })
    ).toMatchObject({ contentType: "image/png", ok: true });
  });

  it("sert les documents en pièce jointe (pas de rendu HTML)", () => {
    const pdf = new TextEncoder().encode("%PDF-1.7...");
    expect(
      decidePublicUpload({
        bytes: pdf,
        declaredType: "application/pdf",
        mode: "any",
      })
    ).toEqual({
      contentType: "application/pdf",
      disposition: "attachment",
      ok: true,
    });
    expect(
      decidePublicUpload({
        bytes: new TextEncoder().encode("bonjour"),
        declaredType: "text/plain",
        mode: "any",
      })
    ).toMatchObject({ disposition: "attachment", ok: true });
  });

  it("refuse les scripts et les types inconnus", () => {
    for (const type of [
      "application/javascript",
      "text/javascript",
      "application/xml",
      "application/octet-stream",
      "application/zip",
    ]) {
      expect(
        decidePublicUpload({
          bytes: new Uint8Array([0x50]),
          declaredType: type,
          mode: "any",
        }).ok,
        type
      ).toBe(false);
    }
  });

  it("le mode image refuse un document", () => {
    expect(
      decidePublicUpload({
        bytes: new TextEncoder().encode("%PDF-1.7"),
        declaredType: "application/pdf",
        mode: "image",
      }).ok
    ).toBe(false);
  });

  it("reconnaît les signatures raster sûres", () => {
    expect(sniffRasterImageMime(PNG)).toBe("image/png");
    expect(sniffRasterImageMime(JPEG)).toBe("image/jpeg");
    expect(sniffRasterImageMime(new TextEncoder().encode("GIF89a...."))).toBe(
      "image/gif"
    );
    expect(sniffRasterImageMime(HTML)).toBeNull();
    expect(sniffRasterImageMime(SVG)).toBeNull();
  });
});
