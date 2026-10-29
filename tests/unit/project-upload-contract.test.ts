import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseProjectUploadResponse } from "@/lib/projects/upload-contract";

describe("Contrat d'upload de fichier projet", () => {
  it("lit la réponse réelle { file: { id, url } } de /cloud/upload", () => {
    expect(
      parseProjectUploadResponse({
        file: {
          id: "b1f6c2f0-0000-4000-8000-000000000000",
          original_name: "rapport.pdf",
          url: "https://s3.z1storage.com/mai-storage-1/cloud/u/f.pdf",
        },
        storage: { tier: "Plus" },
        success: true,
      })
    ).toEqual({
      id: "b1f6c2f0-0000-4000-8000-000000000000",
      url: "https://s3.z1storage.com/mai-storage-1/cloud/u/f.pdf",
    });
  });

  it("accepte l'ancienne forme à plat par compatibilité", () => {
    expect(
      parseProjectUploadResponse({
        file_id: "legacy-id",
        url: "https://cdn.example/file.pdf",
      })
    ).toEqual({ id: "legacy-id", url: "https://cdn.example/file.pdf" });
  });

  it("refuse une réponse incomplète (URL absente, identifiant absent)", () => {
    expect(
      parseProjectUploadResponse({ file: { url: "https://cdn.example/x" } })
    ).toBeNull();
    expect(
      parseProjectUploadResponse({ file: { id: "x", url: "" } })
    ).toBeNull();
    expect(parseProjectUploadResponse({ success: true })).toBeNull();
    expect(parseProjectUploadResponse(null)).toBeNull();
    expect(parseProjectUploadResponse("oops")).toBeNull();
  });

  it("refuse une URL non HTTP(S)", () => {
    expect(
      parseProjectUploadResponse({
        file: { id: "x", url: "javascript:alert(1)" },
      })
    ).toBeNull();
    expect(
      parseProjectUploadResponse({
        file: { id: "x", url: "file:///etc/passwd" },
      })
    ).toBeNull();
  });

  it("le gestionnaire backend renvoie bien file.id et file.url (contrat)", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "storage.ts"),
      "utf8"
    );
    // La forme produite par handleCloudUpload : `file: inserted[0]` avec les
    // colonnes `id` et `url`, et non des champs aplatis à la racine.
    expect(source).toContain("file: inserted[0],");
    expect(source).toContain("RETURNING id, filename, original_name, url");
  });

  it("la route projet consomme le contrat au lieu de lire uploadData.url", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/(chat)/api/projects/[id]/files/route.ts"),
      "utf8"
    );
    expect(source).toContain("parseProjectUploadResponse(upload.data)");
    expect(source).not.toContain("uploadData.url ||");
  });
});
