import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Garde-fou du plafond d'upload de médias.
 *
 * Deux chiffres doivent rester un seul contrat : la limite que le serveur applique
 * (`MEDIA_UPLOAD_LIMITS_BYTES`, dans `config.ts`) et celle que l'interface Vibe
 * promet (`MEDIA_BYTES_PAID`, dans `lib/vibe/services/tierLimits.ts`). Avant cette
 * correction, le client annonçait 1 Go aux payants pendant que `storage.ts`
 * refusait tout ce qui dépassait 50 Mo : l'utilisateur découvrait le vrai plafond
 * en recevant un 413 après une validation cliente réussie.
 *
 * Les modules backend sont hors du typecheck Next (import `npm:` Deno) : ils ne
 * peuvent pas être importés ici, donc le contrat est vérifié sur le source.
 */

const ROOT = path.resolve(import.meta.dirname, "..", "..");

function source(file: string): string {
  return readFileSync(path.join(ROOT, file), "utf8");
}

const MIB = 1024 * 1024;
const GIB = 1024 * MIB;

describe("Plafond d'upload des médias par forfait", () => {
  const config = source("config.ts");

  it("déclare une table de limites dépendante du forfait", () => {
    expect(config).toContain("MEDIA_UPLOAD_LIMITS_BYTES: Record<Tier, number>");
    expect(config).toContain("export function getTierMediaUploadLimitBytes");
  });

  it("accorde 50 Mo en Free et 1 Go aux forfaits payants", () => {
    const table = config.slice(
      config.indexOf("MEDIA_UPLOAD_LIMITS_BYTES: Record<Tier, number>"),
      config.indexOf("getTierMediaUploadLimitBytes")
    );
    expect(table).toContain("Free: 50 * MIB");
    for (const tier of ["Plus", "Pro", "Max"]) {
      expect(table).toContain(`${tier}: GIB`);
    }
  });

  it("retombe sur le forfait le plus strict quand le tier est illisible", () => {
    // `normalizeTier` retourne "Free" pour une valeur inconnue : la limite se
    // réduit, elle ne s'étend jamais. C'est ce qui empêche un JWT muet d'ouvrir
    // le plafond d'un compte Free.
    expect(config).toMatch(
      /MEDIA_UPLOAD_LIMITS_BYTES\[normalizeTier\(tier\)\]/
    );
  });

  it("applique la limite dans le handler d'upload, sans plafond en dur", () => {
    const storage = source("storage.ts");
    const handler = storage.slice(
      storage.indexOf("const handleUploadFile"),
      storage.indexOf('app.post("/upload-file"')
    );

    expect(handler).toContain("getTierMediaUploadLimitBytes(tier)");
    expect(handler).toContain("file.size > maxFileBytes");
    // Aucun littéral de taille ne doit survivre dans le chemin d'upload : il
    // court-circuiterait la table par forfait.
    expect(handler).not.toMatch(/50\s*\*\s*1024\s*\*\s*1024/);
    expect(handler).not.toMatch(/MAX_FILE_SIZE\s*=\s*\d/);
  });

  it("résout le forfait depuis le jeton, avec la clé API en repli", () => {
    const storage = source("storage.ts");
    const handler = storage.slice(
      storage.indexOf("const handleUploadFile"),
      storage.indexOf('app.post("/upload-file"')
    );
    expect(handler).toMatch(
      /payload\?\.tier\s*\|\|\s*extractTierFromApiKey\(token\)/
    );
  });

  it("refuse avant toute lecture du corps du fichier", () => {
    // `await file.arrayBuffer()` matérialise le fichier en mémoire. Le refus de
    // taille doit donc précéder cette lecture, sinon un fichier refusé coûte
    // quand même son empreinte mémoire à l'isolate.
    const storage = source("storage.ts");
    const handler = storage.slice(
      storage.indexOf("const handleUploadFile"),
      storage.indexOf('app.post("/upload-file"')
    );
    expect(handler.indexOf("file.size > maxFileBytes")).toBeLessThan(
      handler.indexOf("file.arrayBuffer()")
    );
  });

  it("laisse l'avatar et le Cloud hors du plafond par forfait", () => {
    // Seule la route des médias change de calibre. L'avatar reste à 10 Mo et
    // `/cloud/upload` à 10 Mo, comptabilisé dans le quota de stockage.
    const storage = source("storage.ts");
    const avatar = storage.slice(
      storage.indexOf("const handleUploadAvatar"),
      storage.indexOf('app.post("/upload-avatar"')
    );
    const cloud = storage.slice(
      storage.indexOf("const handleCloudUpload"),
      storage.indexOf('app.post("/cloud/upload"')
    );
    expect(avatar).toContain("MAX_AVATAR_SIZE = 10 * 1024 * 1024");
    expect(cloud).toContain("MAX_FILE_SIZE = 10 * 1024 * 1024");
    expect(cloud).toContain("getTierStorageLimitBytes(tier)");
  });

  it("aligne la promesse du client Vibe sur la limite du serveur", () => {
    const client = source("lib/vibe/services/tierLimits.ts");
    // Le miroir client doit rester à 1 Go : c'est désormais ce que le serveur
    // applique vraiment. Revenir à 50 Mo ici réintroduirait l'écart inverse.
    expect(client).toContain("MEDIA_BYTES_PAID = 1024 * 1024 * 1024");
    expect(client).toContain("MEDIA_BYTES_FREE = 50 * 1024 * 1024");

    const serverTable = config.slice(
      config.indexOf("MEDIA_UPLOAD_LIMITS_BYTES: Record<Tier, number>"),
      config.indexOf("getTierMediaUploadLimitBytes")
    );
    expect(serverTable).toContain("Free: 50 * MIB");
    expect(serverTable).toContain("Plus: GIB");
  });

  it("garde les copies backend à la racine valides", () => {
    for (const fichier of ["config.ts", "storage.ts"]) {
      expect(source(fichier).length).toBeGreaterThan(0);
    }
  });

  it("ignore le quota de stockage Cloud, qui n'est pas une taille d'envoi", () => {
    // Les deux grandeurs sont proches en lecture et souvent confondues : l'une
    // borne UN fichier, l'autre le TOTAL stocké (10/20/40/60 Go).
    expect(config).toContain("STORAGE_LIMITS_BYTES");
    expect(config).toContain("getTierStorageLimitBytes");
    expect(config).toContain("getTierMediaUploadLimitBytes");
    expect(GIB).toBe(1024 * MIB);
  });
});
