/** Les fichiers de deux comptes restent séparés même si un identifiant étranger est connu. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  del: vi.fn(),
  head: vi.fn(),
  list: vi.fn(),
  presign: vi.fn(),
  sign: vi.fn(),
  user: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getMaiUser: mocks.user }));
vi.mock("@vercel/blob", () => ({
  BlobNotFoundError: class extends Error {},
  del: mocks.del,
  head: mocks.head,
  issueSignedToken: mocks.sign,
  list: mocks.list,
  presignUrl: mocks.presign,
}));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ id: "alice", tier: "plus" });
  mocks.head.mockResolvedValue({ contentType: "text/plain", size: 12 });
  mocks.sign.mockResolvedValue("signed");
  mocks.presign.mockResolvedValue({
    presignedUrl: "https://files.example/test",
  });
  mocks.list.mockResolvedValue({
    blobs: [
      { pathname: "uploads/alice/a.txt", size: 12, uploadedAt: new Date(0) },
      { pathname: "uploads/bob/secret.txt", size: 12, uploadedAt: new Date(0) },
    ],
    hasMore: false,
  });
});
describe("bibliothèque Wakies privée", { timeout: 30_000 }, () => {
  it("liste uniquement les fichiers du compte vérifié", async () => {
    const { GET } = await import("@/app/(chat)/api/wakies/files/route");
    const res = await GET(new Request("https://mai.example/api/wakies/files"));
    expect(res.status).toBe(200);
    expect(
      (await res.json()).files.map(
        (file: { pathname: string }) => file.pathname
      )
    ).toEqual(["uploads/alice/a.txt"]);
    expect(mocks.list).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50, prefix: "uploads/alice/" })
    );
  });
  it("refuse lecture et suppression étrangères avant tout accès au stockage", async () => {
    const { GET, DELETE } = await import("@/app/(chat)/api/wakies/files/route");
    expect(
      (
        await GET(
          new Request(
            "https://mai.example/api/wakies/files?pathname=uploads/bob/secret.txt"
          )
        )
      ).status
    ).toBe(404);
    expect(
      (
        await DELETE(
          new Request("https://mai.example/api/wakies/files", {
            body: JSON.stringify({ pathname: "uploads/bob/secret.txt" }),
            method: "DELETE",
          })
        )
      ).status
    ).toBe(404);
    expect(mocks.head).not.toHaveBeenCalled();
    expect(mocks.del).not.toHaveBeenCalled();
  });
  it("refuse les requêtes sans session, les forfaits Free et les mutations externes", async () => {
    const { GET, DELETE } = await import("@/app/(chat)/api/wakies/files/route");
    mocks.user.mockResolvedValue(null);
    expect(
      (await GET(new Request("https://mai.example/api/wakies/files"))).status
    ).toBe(401);
    mocks.user.mockResolvedValue({ id: "alice", tier: "free" });
    expect(
      (await GET(new Request("https://mai.example/api/wakies/files"))).status
    ).toBe(403);
    expect(
      (
        await DELETE(
          new Request("https://mai.example/api/wakies/files", {
            body: JSON.stringify({ pathname: "uploads/alice/a.txt" }),
            headers: { origin: "https://hostile.example" },
            method: "DELETE",
          })
        )
      ).status
    ).toBe(403);
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.del).not.toHaveBeenCalled();
  });
  it("renouvelle un lien privé et signale un fichier supprimé sans inventer de lien", async () => {
    const { GET } = await import("@/app/(chat)/api/wakies/files/route");
    const res = await GET(
      new Request(
        "https://mai.example/api/wakies/files?pathname=uploads/alice/a.txt"
      )
    );
    expect((await res.json()).url).toBe("https://files.example/test");
    const { signerPieceJointe } = await import("@/lib/wakies/blob");
    mocks.head.mockRejectedValue(new Error("Supprimé"));
    expect(await signerPieceJointe("alice", "uploads/alice/a.txt")).toBeNull();
  });
});
