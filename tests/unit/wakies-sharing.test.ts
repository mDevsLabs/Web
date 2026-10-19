// Les fiches partagées ne doivent exposer que des champs volontairement publics.

import QRCode from "qrcode";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WakieShare } from "@/components/wakies/WakieShare";
import { lienPartageWakie } from "@/lib/wakies/shared/sharing";

const mocks = vi.hoisted(() => ({
  fiche: vi.fn(),
  findWakie: vi.fn(),
  galerie: vi.fn(),
  owner: vi.fn(),
  profil: vi.fn(),
  signer: vi.fn(),
}));

vi.mock("@/lib/wakies/queries", () => ({
  ensureProfilWakie: vi.fn(),
  extraitPersonaPublique: (wakie: { publicPersona?: string }, max = 600) =>
    (wakie.publicPersona ?? "").slice(0, max),
  findWakie: mocks.findWakie,
  lireProfilPublic: mocks.profil,
  listerImagesWakie: mocks.galerie,
  mettreAJourProfilWakie: vi.fn(),
  proprietaireWakiePublic: mocks.owner,
  trouverWakiePublic: mocks.fiche,
}));
vi.mock("@/lib/wakies/blob", () => ({
  pathnameDuCompte: vi.fn(),
  signerBlobDuProprietaire: mocks.signer,
}));
vi.mock("@/lib/wakies/http", () => ({
  badRequest: (message: string) => Response.json({ message }, { status: 400 }),
  isResponse: (value: unknown) => value instanceof Response,
  json: (data: unknown) => Response.json(data),
  notFound: (message: string) => Response.json({ message }, { status: 404 }),
  rejectCrossOriginMutation: vi.fn(),
  requireWakiesUser: vi.fn(async () => ({ tier: "plus", userId: "visiteur" })),
  toErrorResponse: () => Response.json({}, { status: 500 }),
}));
vi.mock("@/lib/api/error-response", () => ({
  errorResponse: () => Response.json({}, { status: 400 }),
  zodIssuesMessage: () => "Requête invalide.",
}));

const ID = "11111111-1111-4111-8111-111111111111";

function preparerFiche() {
  mocks.fiche.mockResolvedValue({
    accent: null,
    avatar: "avatar33",
    bio: "Bio publique",
    handle: "wakie-public",
    name: "Wakie public",
    publicPersona: "Persona publiée",
    wakieId: ID,
  });
  mocks.owner.mockResolvedValue("owner-private-id");
  mocks.profil.mockResolvedValue({
    avatarPath: "uploads/owner-private-id/private-avatar.png",
    bannerPath: "uploads/owner-private-id/private-banner.png",
    bio: "Bio publique détaillée",
    instructions: "Ne jamais afficher ces instructions privées",
    links: [
      "https://example.com",
      "javascript:alert(1)",
      "https://user:secret@example.com/private",
    ],
    name: "Profil privé interne",
  });
  mocks.galerie.mockResolvedValue([
    {
      alt: "Illustration publique",
      blobPathname: "uploads/owner-private-id/private-gallery.png",
      id: "image-public-id",
    },
  ]);
  mocks.signer.mockImplementation(
    async () => "https://blob.example/signed-public-image"
  );
}

describe("partage public de Wakie", { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("ne renvoie pas une fiche absente de l’annuaire public", async () => {
    mocks.fiche.mockResolvedValue(null);
    const { lireFicheWakiePartagee } = await import(
      "@/lib/wakies/public-profile"
    );
    await expect(lireFicheWakiePartagee(ID)).resolves.toBeNull();
    expect(mocks.owner).not.toHaveBeenCalled();
    expect(mocks.profil).not.toHaveBeenCalled();
  });

  it("retire les chemins internes, instructions et liens non HTTP", async () => {
    preparerFiche();
    const { lireFicheWakiePartagee } = await import(
      "@/lib/wakies/public-profile"
    );
    const fiche = await lireFicheWakiePartagee(ID);
    expect(fiche).toMatchObject({
      avatar: "avatar33",
      id: ID,
      profil: {
        bio: "Bio publique détaillée",
        handle: "wakie-public",
        isPublic: true,
        links: ["https://example.com"],
        name: "Wakie public",
        personaPubliee: "Persona publiée",
      },
    });
    expect(fiche?.images[0]).toEqual({
      alt: "Illustration publique",
      id: "image-public-id",
      url: "https://blob.example/signed-public-image",
    });
    expect(JSON.stringify(fiche)).not.toContain("owner-private-id");
    expect(JSON.stringify(fiche)).not.toContain("private-avatar.png");
    expect(JSON.stringify(fiche)).not.toContain("instructions");
    expect(mocks.galerie).toHaveBeenCalledWith(ID, { publicSeulement: true });
  });

  it("refuse la fiche si sa publication est retirée pendant la lecture", async () => {
    preparerFiche();
    mocks.fiche
      .mockResolvedValueOnce({ name: "Wakie public", publicPersona: "OK" })
      .mockResolvedValueOnce(null);
    const { lireFicheWakiePartagee } = await import(
      "@/lib/wakies/public-profile"
    );
    await expect(lireFicheWakiePartagee(ID)).resolves.toBeNull();
  });

  it("garde le partage désactivé tant que la fiche n’est pas publique", () => {
    const html = renderToStaticMarkup(
      createElement(WakieShare, {
        id: ID,
        isPublic: false,
        name: "Wakie privé",
      })
    );
    expect(html).toContain("Partager ce Wakie");
    expect(html).toContain("Enregistrez la fiche");
    expect(html).toMatch(/<button[^>]*disabled=""/);
  });

  it("génère un PNG QR local contenant le lien de la fiche", async () => {
    const lien = lienPartageWakie(ID, "https://preview.example");
    const qr = await QRCode.toDataURL(lien, { width: 640 });
    expect(qr).toMatch(/^data:image\/png;base64,/);
    expect(qr.length).toBeGreaterThan(500);
  });

  it("applique la même sélection publique à l’API de fiche", async () => {
    preparerFiche();
    mocks.findWakie.mockResolvedValue(null);
    const { GET } = await import(
      "@/app/(chat)/api/wakies/wakies/[id]/profile/route"
    );
    const response = await GET(new Request("https://mai.example/profile"), {
      params: Promise.resolve({ id: ID }),
    });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.profil.name).toBe("Wakie public");
    expect(body.profil.instructions).toBeUndefined();
    expect(body.profil.avatarPath).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("owner-private-id");
  });
});
