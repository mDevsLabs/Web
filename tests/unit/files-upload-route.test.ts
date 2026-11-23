import { beforeEach, describe, expect, it, vi } from "vitest";

// Contrat de la route d'import de fichiers (issue #47) : les formats annoncés
// (PNG, JPEG, TXT…) sont conservés quand le stockage répond ; sans stockage
// configuré, l'échec est explicite et récupérable — jamais un 500 opaque, et
// jamais présenté comme un succès. HTML, SVG et JavaScript restent refusés.

const {
  delMock,
  issueSignedTokenMock,
  presignUrlMock,
  putMock,
  syncUploadedImageToLibraryMock,
} = vi.hoisted(() => ({
  delMock: vi.fn(async () => undefined),
  issueSignedTokenMock: vi.fn(async () => ({
    clientSigningToken: "signature-test",
    delegationToken: "delegation-test",
    validUntil: Date.now() + 600_000,
  })),
  presignUrlMock: vi.fn(async () => ({
    presignedUrl: "https://blob.test/uploads/lien-signe",
  })),
  putMock: vi.fn(async () => ({
    pathname: "uploads/utilisateur-test/fichier",
    url: "https://blob.test/uploads/utilisateur-test/fichier",
  })),
  syncUploadedImageToLibraryMock: vi.fn(
    async (): Promise<
      | { fileId: string | null; saved: true; url: string | null }
      | {
          reason:
            | "file_too_large"
            | "not_image"
            | "quota_exceeded"
            | "unauthenticated"
            | "unavailable";
          saved: false;
        }
    > => ({
      fileId: "cloud-file-1",
      saved: true,
      url: "https://cdn.test/cloud/photo.png",
    })
  ),
}));

vi.mock("@/app/(auth)/auth", () => ({
  auth: async () => ({ user: { id: "utilisateur-test" } }),
}));
vi.mock("@vercel/blob", () => ({
  del: delMock,
  issueSignedToken: issueSignedTokenMock,
  presignUrl: presignUrlMock,
  put: putMock,
}));
vi.mock("@/lib/files/library-sync", () => ({
  syncUploadedImageToLibrary: syncUploadedImageToLibraryMock,
}));

import { POST } from "@/app/(chat)/api/files/upload/route";
import { API_ERROR_STATUS } from "@/lib/api/error-codes";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

function uploadRequest(name: string, type: string, bytes: Uint8Array): Request {
  const formData = new FormData();
  formData.append(
    "file",
    new File([bytes as unknown as BlobPart], name, { type })
  );
  return new Request("https://test.local/api/files/upload", {
    body: formData,
    method: "POST",
  });
}

function configureStorage() {
  process.env.BLOB_READ_WRITE_TOKEN = "jeton-test";
  delete process.env.VERCEL_OIDC_TOKEN;
  delete process.env.BLOB_STORE_ID;
}

function clearStorage() {
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.VERCEL_OIDC_TOKEN;
  delete process.env.BLOB_STORE_ID;
}

describe("Import de fichiers — /api/files/upload (issue #47)", () => {
  beforeEach(() => {
    putMock.mockClear();
    issueSignedTokenMock.mockClear();
    presignUrlMock.mockClear();
    delMock.mockClear();
    syncUploadedImageToLibraryMock.mockClear();
    configureStorage();
  });

  it("conserve un PNG, un JPEG et un TXT sous la limite quand le stockage est configuré", async () => {
    const fixtures: [string, string, Uint8Array][] = [
      ["photo.png", "image/png", PNG],
      ["photo.jpg", "image/jpeg", JPEG],
      ["notes.txt", "text/plain", new TextEncoder().encode("272 octets")],
    ];

    for (const [name, type, bytes] of fixtures) {
      putMock.mockClear();
      const response = await POST(uploadRequest(name, type, bytes));
      expect(response.status).toBe(200);
      const body = (await response.json()) as { url: string };
      // L'URL renvoyée est l'URL signée, pas l'URL brute du blob.
      expect(body.url).toBe("https://blob.test/uploads/lien-signe");
      expect(putMock).toHaveBeenCalledTimes(1);
    }
  });

  it("répond un échec explicite et récupérable sans stockage configuré (pas un 500 opaque)", async () => {
    clearStorage();

    const response = await POST(uploadRequest("photo.png", "image/png", PNG));

    expect(response.status).toBe(API_ERROR_STATUS.service_unavailable);
    expect(response.status).not.toBe(500);
    const body = (await response.json()) as { code: string; message: string };
    expect(body.code).toBe("service_unavailable");
    // Le message nomme la cause : l'utilisateur sait que le stockage manque,
    // pas que « son fichier a été retiré ».
    expect(body.message).toContain("stockage de fichiers n'est pas configuré");
    // Rien n'a été envoyé au stockage.
    expect(putMock).not.toHaveBeenCalled();
  });

  it("reste explicite quand le stockage refuse l'envoi malgré une configuration présente", async () => {
    // Exception réellement observée en local sans credential :
    // `BlobError: Vercel Blob: No blob credentials found…`
    putMock.mockRejectedValueOnce(
      new Error("Vercel Blob: No blob credentials found.")
    );

    const response = await POST(uploadRequest("photo.png", "image/png", PNG));

    expect(response.status).toBe(API_ERROR_STATUS.service_unavailable);
    const body = (await response.json()) as { message: string };
    expect(body.message).toContain("étape : écriture");
    expect(body.message).toContain("n'a pas été envoyé");
  });

  it("nomme l'étape de signature quand la signature d'URL échoue", async () => {
    issueSignedTokenMock.mockRejectedValueOnce(new Error("signature refusée"));

    const response = await POST(
      uploadRequest("notes.txt", "text/plain", new TextEncoder().encode("x"))
    );

    expect(response.status).toBe(API_ERROR_STATUS.service_unavailable);
    const body = (await response.json()) as { message: string };
    expect(body.message).toContain("étape : signature");
    // Le blob déjà écrit est nettoyé.
    expect(delMock).toHaveBeenCalledTimes(1);
  });

  it("refuse toujours text/html, le SVG et le JavaScript", async () => {
    const refusés: [string, string][] = [
      ["page.html", "text/html"],
      ["dessin.svg", "image/svg+xml"],
      ["script.js", "text/javascript"],
    ];

    for (const [name, type] of refusés) {
      const response = await POST(
        uploadRequest(name, type, new TextEncoder().encode("<payload>"))
      );
      expect(response.status).toBe(API_ERROR_STATUS.unsupported_media_type);
    }
    expect(putMock).not.toHaveBeenCalled();
  });

  it("synchronise les images importées vers la Bibliothèque en best-effort sans bloquer si le quota est plein", async () => {
    const imgResponse = await POST(
      uploadRequest("photo.png", "image/png", PNG)
    );
    expect(imgResponse.status).toBe(200);
    const imgBody = (await imgResponse.json()) as {
      library?: { fileId?: string; saved?: boolean };
    };
    expect(syncUploadedImageToLibraryMock).toHaveBeenCalledTimes(1);
    expect(imgBody.library?.saved).toBe(true);

    syncUploadedImageToLibraryMock.mockResolvedValueOnce({
      reason: "quota_exceeded",
      saved: false,
    });
    const fullResponse = await POST(
      uploadRequest("photo2.jpg", "image/jpeg", JPEG)
    );
    expect(fullResponse.status).toBe(200);
    const fullBody = (await fullResponse.json()) as {
      library?: { reason?: string; saved?: boolean };
    };
    expect(fullBody.library).toEqual({
      reason: "quota_exceeded",
      saved: false,
    });

    syncUploadedImageToLibraryMock.mockClear();
    const txtResponse = await POST(
      uploadRequest("notes.txt", "text/plain", new TextEncoder().encode("ok"))
    );
    expect(txtResponse.status).toBe(200);
    expect(syncUploadedImageToLibraryMock).not.toHaveBeenCalled();
  });
});
