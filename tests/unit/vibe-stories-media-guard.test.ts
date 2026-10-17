import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Verrous du média de story.
 *
 * C'est la régression la plus probable de ce chantier : depuis que le plafond de
 * `/upload-file` dépend du forfait (1 Go pour les payants), transiter par cet
 * endpoint ne garantit plus la règle produit « story ≤ 50 Mo ». La borne doit donc
 * être recontrôlée à la création de la story, sur le serveur.
 */

const RACINE = path.resolve(import.meta.dirname, "..", "..");

function source(chemin: string): string {
  return readFileSync(path.join(RACINE, chemin), "utf8");
}

const stories = source("vibe-stories.ts");
const config = source("config.ts");

describe("Bornes des médias de story", () => {
  it("borne la story à 50 Mo, indépendamment du forfait", () => {
    expect(stories).toContain(
      "export const STORY_MEDIA_MAX_BYTES = 50 * 1024 * 1024"
    );
    expect(stories).toContain("sizeBytes > STORY_MEDIA_MAX_BYTES");
  });

  it("garde les deux plafonds distincts dans la source", () => {
    // Le plafond d'upload (par forfait) et celui de la story (fixe) sont deux
    // contrats différents : les fusionner serait soit ouvrir les stories à 1 Go,
    // soit rabaisser les posts payants à 50 Mo.
    expect(config).toContain("MEDIA_UPLOAD_LIMITS_BYTES");
    expect(stories).toContain("STORY_MEDIA_MAX_BYTES");
    expect(stories).not.toContain("getTierMediaUploadLimitBytes");
  });

  it("relit la taille sur l'objet stocké plutôt que sur la déclaration du client", () => {
    // `file_size_bytes` envoyé par le navigateur est falsifiable : un compte peut
    // déclarer 1 Mo pour un fichier de 400 Mo. La autorité est le HEAD sur le
    // stockage, qui renvoie Content-Length.
    expect(stories).toContain('{ method: "HEAD" }');
    expect(stories).toContain("content-length");
    expect(stories).toContain("readStoredObjectSize");
  });

  it("refuse un média dont la taille n'a pas pu être vérifiée", () => {
    // Un objet injoignable ne doit pas être stocké comme story « valide » : la
    // publication échoue plutôt que d'enregistrer un média non pesé.
    const lecture = stories.slice(
      stories.indexOf("async function readStoredObjectSize"),
      stories.indexOf("/** Identité du compte")
    );
    expect(lecture).toContain("if (!res.ok) return null;");
    expect(stories).toContain("Média introuvable sur le stockage.");
  });

  it("n'accepte que des médias issus du pool de stockage configuré", () => {
    // Sans cette liste, un compte publierait une URL externe que le navigateur
    // d'un autre chargerait comme <img>/<video> dans son fil : contenu
    // illégitime servi depuis un profil, et fuite d'IP du spectateur.
    expect(stories).toContain("allowedMediaOrigins()");
    expect(stories).toContain("getStorageNodes()");
    expect(stories).toMatch(/new URL\(String\(rawUrl \|\| ""\)\)/);
    expect(stories).toContain(
      "if (!allowedMediaOrigins().has(url.origin)) return null;"
    );
  });

  it("compare les origines en entier, pas par un préfixe de chaîne", () => {
    // `startsWith` sur une URL se fait contourner par un hôte fabriqué
    // (« s3.z1storage.com.evil.tld »). L'origine normalisée est la seule
    // comparaison correcte.
    expect(stories).not.toMatch(/url\.startsWith\(/);
    expect(stories).toContain(".origin)");
  });

  it("limite l'objet revendiqué au namespace d'envoi", () => {
    // Un chemin d'avatar ou de fichier cloud d'un autre compte ne doit pas
    // pouvoir être adopté comme média de story.
    expect(stories).toContain("STORY_PATHNAME_PATTERN = /^uploads");
    expect(stories).toContain("STORY_PATHNAME_PATTERN.test(pathname)");
    expect(stories).toContain(
      'const pathname = String(rawPathname || "").trim();'
    );
  });

  it("accepte photo et vidéo, et rien d'autre", () => {
    expect(stories).toContain('mediaType !== "image" && mediaType !== "video"');
    expect(stories).toContain("Type de média non supporté.");
  });
});
