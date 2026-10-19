/** Le stockage est celui des pièces jointes privées du chat mAI ; le préfixe du compte est vérifié avant chaque opération. */
import { BlobNotFoundError, del, head, list } from "@vercel/blob";
import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import { pathnameDuCompte, signerPieceJointe } from "@/lib/wakies/blob";
import {
  isResponse,
  json,
  notFound,
  rejectCrossOriginMutation,
  requireWakiesUser,
} from "@/lib/wakies/http";

const query = z.object({
  cursor: z.string().max(2048).optional(),
  pathname: z.string().max(512).optional(),
});
const removal = z.object({ pathname: z.string().min(1).max(512) });
export async function GET(request: Request) {
  const identity = await requireWakiesUser();
  if (isResponse(identity)) return identity;
  const params = new URL(request.url).searchParams;
  const parsed = query.safeParse({
    cursor: params.get("cursor") ?? undefined,
    pathname: params.get("pathname") ?? undefined,
  });
  if (!parsed.success)
    return errorResponse("invalid_request", {
      message: "Paramètres de fichiers invalides.",
    });
  try {
    if (parsed.data.pathname !== undefined) {
      const pathname = pathnameDuCompte(identity.userId, parsed.data.pathname);
      if (!pathname) return notFound("Fichier introuvable.");
      const metadata = await head(pathname);
      return json(
        {
          mediaType: metadata.contentType,
          name: pathname.split("/").at(-1) ?? "Fichier",
          pathname,
          size: metadata.size,
          url: await signerPieceJointe(identity.userId, pathname),
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    const result = await list({
      cursor: parsed.data.cursor,
      limit: 50,
      prefix: `uploads/${identity.userId}/`,
    });
    return json(
      {
        cursor: result.hasMore ? result.cursor : null,
        files: result.blobs
          .filter((blob) => pathnameDuCompte(identity.userId, blob.pathname))
          .map((blob) => ({
            name: blob.pathname.split("/").at(-1) ?? "Fichier",
            pathname: blob.pathname,
            size: blob.size,
            uploadedAt: blob.uploadedAt.getTime(),
          })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof BlobNotFoundError)
      return notFound("Fichier introuvable.");
    return errorResponse("internal_error", {
      message:
        "Le stockage de fichiers mAI est indisponible. Réessayez plus tard.",
    });
  }
}
export async function DELETE(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const identity = await requireWakiesUser();
  if (isResponse(identity)) return identity;
  const parsed = removal.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return errorResponse("invalid_request", { message: "Fichier invalide." });
  const pathname = pathnameDuCompte(identity.userId, parsed.data.pathname);
  if (!pathname) return notFound("Fichier introuvable.");
  try {
    await del(pathname);
    return json({ ok: true });
  } catch {
    return errorResponse("internal_error", {
      message: "Le fichier n’a pas pu être supprimé.",
    });
  }
}
