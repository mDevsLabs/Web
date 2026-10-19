import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import {
  isResponse,
  json,
  rejectCrossOriginMutation,
  requireWakiesUser,
} from "@/lib/wakies/http";
import {
  listerReactions,
  poserReaction,
  retirerReaction,
} from "@/lib/wakies/queries";
import {
  estReactionValide,
  PALETTE_REACTIONS,
} from "@/lib/wakies/shared/reactions";

/**
 * GET    ?id=...&id=... — réactions d'un lot de messages (groupées par id).
 * POST   { emoji, byWakieId? }  — pose une réaction.
 * DELETE { emoji, byWakieId? }  — retire une réaction.
 *
 * La palette est FIXE et vit dans `lib/wakies/shared/reactions.ts` — le même
 * module que celui qui alimente la barre de réaction : le client ne peut donc
 * pas proposer un émoji que cette route refuse. Une réaction posée deux fois
 * du même auteur (compte ou Wakie) n'écrit rien et reste un succès : la pose
 * est idempotente, comme un double-clic ne doit pas produire deux cœurs.
 * `byWakieId` n'est accepté QUE du compte : l'IA ne réagit jamais au nom d'un
 * Wakie étranger.
 */

const schema = z.object({
  byWakieId: z.string().uuid().nullable().optional(),
  emoji: z.string().min(1).max(16),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { id } = await params;
  if (!id) {
    return errorResponse("invalid_request", {
      message: "Identifiant de message requis.",
    });
  }
  const url = new URL(request.url);
  const ids = [id, ...url.searchParams.getAll("id")]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 200);
  const reactions = await listerReactions(identite.userId, ids);
  // Une Map ne se sérialise pas : tableau indexé par message.
  return json(
    {
      reactions: [...reactions.entries()].map(
        ([messageId, groupe]) =>
          [messageId, groupe] satisfies [string, typeof groupe]
      ),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "Requête de réaction invalide.",
    });
  }
  if (!estReactionValide(parsed.data.emoji)) {
    return errorResponse("invalid_request", {
      message: `Émoji hors palette. Choix possibles : ${PALETTE_REACTIONS.join(" ")}`,
    });
  }
  const { id } = await params;
  const ok = await poserReaction(
    identite.userId,
    id,
    parsed.data.emoji,
    parsed.data.byWakieId ?? null
  );
  if (!ok) {
    return errorResponse("not_found", {
      message: "Message ou Wakie introuvable sur ce compte.",
    });
  }
  return json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: "Requête de réaction invalide.",
    });
  }
  // Le retrait accepte exactement la même palette que la pose : un émoji
  // jamais posable ne doit pas pouvoir être « retiré » avec un autre message
  // d'erreur, les deux chemins disent la même chose.
  if (!estReactionValide(parsed.data.emoji)) {
    return errorResponse("invalid_request", {
      message: `Émoji hors palette. Choix possibles : ${PALETTE_REACTIONS.join(" ")}`,
    });
  }
  const { id } = await params;
  const ok = await retirerReaction(
    identite.userId,
    id,
    parsed.data.emoji,
    parsed.data.byWakieId ?? null
  );
  return json({ ok });
}
