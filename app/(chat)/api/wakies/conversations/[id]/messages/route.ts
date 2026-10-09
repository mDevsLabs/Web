import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import { type AttachmentPart, signerPieceJointe } from "@/lib/wakies/blob";
import {
  isResponse,
  json,
  notFound,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { findConversation, listMessages } from "@/lib/wakies/queries";

/**
 * GET /api/wakies/conversations/:id/messages — historique de la conversation.
 *
 * Dans le gabarit, l'historique était demandé à Intelligence à chaque
 * ouverture. Ici il est dans `WakiesMessage`, dans l'ordre d'écriture (`seq`),
 * et la lecture est scopée au compte : une conversation d'un autre compte
 * renvoie 404, pas 403 — l'existence même ne doit pas être devinée.
 *
 * PAGINATION
 *
 * `?limite` borne la page (200 par défaut, 500 au maximum) et `?avant` prend
 * un `seq` : le curseur est l'ordre d'écriture, pas l'horodatage, donc deux
 * pages successives ne se chevauchent jamais même quand plusieurs messages
 * partagent le même `createdAt`. `seqProchain` renvoie le curseur de la page
 * suivante, ou `null` quand il n'y en a plus.
 *
 * PIÈCES JOINTES
 *
 * L'URL signée d'un téléversement expire en dix minutes. Les parts ne
 * transportent donc que le `pathname`, et la signature est REFAITE ici, à la
 * lecture, pour ce compte. Un blob disparu donne `url: null` : le message
 * reste lisible et la pièce est annoncée indisponible, jamais reconstituée.
 */

const QUERIES = z.object({
  avant: z.coerce.number().int().nonnegative().optional(),
  limite: z.coerce.number().int().min(1).max(500).optional(),
});

/** Une part qui porte un `pathname` : c'est le cas d'une pièce jointe. */
type PartAvecBlob = AttachmentPart & { pathname: string };

function estPieceJointe(part: unknown): part is PartAvecBlob {
  return (
    typeof part === "object" &&
    part !== null &&
    typeof (part as { pathname?: unknown }).pathname === "string"
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { id } = await params;
  if (!(await findConversation(identite.userId, id))) {
    return notFound("Conversation introuvable.");
  }
  const url = new URL(request.url);
  const parsed = QUERIES.safeParse({
    avant: url.searchParams.get("avant") ?? undefined,
    limite: url.searchParams.get("limite") ?? undefined,
  });

  if (!parsed.success)
    return errorResponse("invalid_request", {
      message: "Curseur d’historique invalide.",
    });
  const { avant, limite } = parsed.data;
  const rows = await listMessages(identite.userId, id, {
    avantSeq: avant,
    limite: (limite ?? 200) + 1,
  });

  const hasMore = rows.length > (limite ?? 200);
  const visible = hasMore ? rows.slice(1) : rows;
  // Une seule passe de signature pour toutes les pièces de la page : les
  // URL signées sont courtes, mais elles ne doivent pas être regénérées pour
  // chaque rechargement du transcript si le client ne les demande pas.
  const signees = new Map<string, string | null>();
  const signer = async (pathname: string): Promise<string | null> => {
    if (!signees.has(pathname)) {
      signees.set(pathname, await signerPieceJointe(identite.userId, pathname));
    }
    return signees.get(pathname) ?? null;
  };

  const messages = await Promise.all(
    visible.map(async (row) => {
      const parts = await Promise.all(
        (Array.isArray(row.parts) ? row.parts : []).map(async (part) => {
          if (!estPieceJointe(part)) {
            return part;
          }
          return { ...part, url: await signer(part.pathname) };
        })
      );
      return {
        createdAt: row.createdAt,
        id: row.id,
        parts,
        role: row.role,
        seq: row.seq,
      };
    })
  );

  const premier = visible.at(0);
  return json(
    {
      messages,
      // `null` quand la page rend le début de l'historique : rien à recharger.
      seqProchain: hasMore && premier ? premier.seq : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
