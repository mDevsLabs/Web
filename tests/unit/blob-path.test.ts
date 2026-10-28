import { describe, expect, it, vi } from "vitest";
import {
  blobPathnameFromUrl,
  isBlobPathnameOwnedBy,
  refreshBlobAttachmentUrls,
} from "@/lib/files/blob-path";

const BLOB =
  "https://store.private.blob.vercel-storage.com/uploads/user-1/photo.png?token=old";

describe("Références durables des pièces jointes", () => {
  it("extrait le pathname d'un blob Vercel (privé ou public)", () => {
    expect(blobPathnameFromUrl(BLOB)).toBe("uploads/user-1/photo.png");
    expect(
      blobPathnameFromUrl(
        "https://store.public.blob.vercel-storage.com/uploads/u/doc.pdf"
      )
    ).toBe("uploads/u/doc.pdf");
    expect(blobPathnameFromUrl("https://cdn.example/uploads/u/doc.pdf")).toBe(
      null
    );
    expect(blobPathnameFromUrl("not a url")).toBe(null);
  });

  it("vérifie la propriété par préfixe de compte, sans traversal", () => {
    expect(isBlobPathnameOwnedBy("uploads/user-1/a.png", "user-1")).toBe(true);
    expect(isBlobPathnameOwnedBy("uploads/user-10/a.png", "user-1")).toBe(
      false
    );
    expect(
      isBlobPathnameOwnedBy("uploads/user-1/../user-2/a.png", "user-1")
    ).toBe(false);
    expect(isBlobPathnameOwnedBy("avatars/user-1/a.png", "user-1")).toBe(false);
  });

  it("réémet l'URL d'un blob expiré du compte, pas celle d'un autre compte", async () => {
    const signer = vi.fn(async (pathname: string) =>
      pathname === "uploads/user-1/photo.png"
        ? "https://store.private.blob.vercel-storage.com/uploads/user-1/photo.png?token=fresh"
        : null
    );
    const messages = [
      {
        id: "m1",
        parts: [
          { text: "voir", type: "text" },
          { pathname: "uploads/user-1/photo.png", type: "file", url: BLOB },
        ],
        role: "user",
      },
      {
        id: "m2",
        parts: [
          {
            pathname: "uploads/user-2/secret.png",
            type: "file",
            url: "https://store.private.blob.vercel-storage.com/uploads/user-2/secret.png?token=old",
          },
        ],
        role: "user",
      },
      {
        id: "m3",
        parts: [{ type: "file", url: "https://cdn.example/file.pdf" }],
        role: "user",
      },
    ];

    const refreshed = await refreshBlobAttachmentUrls(
      messages,
      "user-1",
      signer
    );
    const own = refreshed[0].parts as Record<string, unknown>[];
    const foreign = refreshed[1].parts as Record<string, unknown>[];
    const external = refreshed[2].parts as Record<string, unknown>[];

    expect(own[1].url).toContain("token=fresh");
    expect(foreign[0].url).toContain("token=old");
    expect(external[0].url).toBe("https://cdn.example/file.pdf");
    expect(signer).toHaveBeenCalledTimes(1);
    expect(signer).toHaveBeenCalledWith("uploads/user-1/photo.png");
  });

  it("dérive le pathname de l'URL quand la partie historique n'en porte pas", async () => {
    const signer = vi.fn(async () => "https://blob/fresh");
    const messages = [
      {
        parts: [{ type: "file", url: BLOB }],
      },
    ];
    const refreshed = await refreshBlobAttachmentUrls(
      messages,
      "user-1",
      signer
    );
    expect((refreshed[0].parts as Record<string, unknown>[])[0].url).toBe(
      "https://blob/fresh"
    );
  });

  it("ne modifie rien si le signataire échoue", async () => {
    const signer = vi.fn(async () => null);
    const messages = [
      {
        parts: [{ pathname: "uploads/user-1/a.png", type: "file", url: BLOB }],
      },
    ];
    const refreshed = await refreshBlobAttachmentUrls(
      messages,
      "user-1",
      signer
    );
    expect(refreshed).toBe(messages);
  });
});
